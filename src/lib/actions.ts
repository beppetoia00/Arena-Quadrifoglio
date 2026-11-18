"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, mutateDb, newId } from "./db";
import {
  adminPin,
  clearAdmin,
  clearSession,
  currentPlayer,
  isAdmin,
  isManager,
  setAdmin,
  setSession,
} from "./auth";
import { savePhoto } from "./storage";
import { Attrs, DB, Lineup, Match, MatchPlayerStat, Player, Position, POSITIONS, TEAM_LABEL, TeamId, Transfer } from "./types";
import { ATTR_KEYS, formatValue, MAX_OVR, MIN_OVR, ratePlayer } from "./rating";
import { getFormation } from "./formations";
import { parseBulkLine } from "./bulk";
import { notifyPlayers } from "./push";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (message?: string): ActionResult => ({ ok: true, message });

function revalidateAll() {
  revalidatePath("/", "layout");
}

/** Run a mutation and return an error message instead of throwing (server actions would 500). */
async function tryMutate(fn: (db: DB) => void | Promise<void>): Promise<string | null> {
  try {
    await mutateDb(fn);
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return msg === "conflict" ? "Troppe scritture contemporanee, riprova tra un attimo" : msg;
  }
}

const num = (v: FormDataEntryValue | null, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/* ---------------- auth ---------------- */

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const playerId = str(formData.get("playerId"));
  const pin = str(formData.get("pin"));
  const db = await getDb();
  const player = db.players.find((p) => p.id === playerId);
  if (!player) return fail("Scegli il tuo giocatore");
  if (player.pin !== pin) return fail("PIN sbagliato. Chiedilo all'admin!");
  await setSession(player.id);
  revalidateAll();
  redirect("/vota");
}

export async function logoutAction() {
  await clearSession();
  revalidateAll();
  redirect("/");
}

export async function adminLoginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const pin = str(formData.get("pin"));
  if (pin !== adminPin()) return fail("PIN admin errato");
  await setAdmin();
  revalidateAll();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdmin();
  revalidateAll();
  redirect("/");
}

/* ---------------- votes ---------------- */

export async function submitVoteAction(input: {
  playerId: string;
  overall: number;
  attrs?: Attrs | null;
}): Promise<ActionResult> {
  const me = await currentPlayer();
  if (!me) return fail("Devi entrare con il tuo giocatore per votare");
  if (me.id === input.playerId) return fail("Non vale autovotarsi 😅");
  const overall = Math.round(Number(input.overall));
  if (!Number.isFinite(overall) || overall < MIN_OVR || overall > MAX_OVR)
    return fail(`Il voto deve essere tra ${MIN_OVR} e ${MAX_OVR}`);
  let attrs: Attrs | undefined;
  if (input.attrs) {
    attrs = {} as Attrs;
    for (const k of ATTR_KEYS) {
      const v = Math.round(Number(input.attrs[k]));
      if (!Number.isFinite(v) || v < 1 || v > 99) return fail("Attributi non validi");
      attrs[k] = v;
    }
  }
  const mErr = await tryMutate((db) => {
    if (!db.settings.votingOpen) throw new Error("Le votazioni sono chiuse");
    if (!db.players.some((p) => p.id === input.playerId)) throw new Error("Giocatore non trovato");
    const existing = db.votes.find((v) => v.voterId === me.id && v.playerId === input.playerId);
    const now = new Date().toISOString();
    if (existing) {
      existing.overall = overall;
      existing.attrs = attrs;
      existing.updatedAt = now;
    } else {
      db.votes.push({ voterId: me.id, playerId: input.playerId, overall, attrs, updatedAt: now });
    }
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok("Voto registrato!");
}

/* ---------------- lineups ---------------- */

export async function createLineupAction(input: {
  title: string;
  formation: { blacks: string; blancos: string };
  slots: { blacks: (string | null)[]; blancos: (string | null)[] };
}): Promise<ActionResult & { id?: string }> {
  const me = await currentPlayer();
  if (!me) return fail("Entra per creare una formazione");
  const fb = getFormation(input.formation.blacks);
  const fw = getFormation(input.formation.blancos);
  const blacks = (input.slots.blacks ?? []).slice(0, fb.slots.length);
  const blancos = (input.slots.blancos ?? []).slice(0, fw.slots.length);
  const chosen = [...blacks, ...blancos].filter(Boolean) as string[];
  if (new Set(chosen).size !== chosen.length) return fail("Un giocatore è presente due volte");
  if (chosen.length < 2) return fail("Scegli almeno qualche giocatore");
  const id = newId("l_");
  const mErr = await tryMutate((db) => {
    for (const pid of chosen) if (!db.players.some((p) => p.id === pid)) throw new Error("Giocatore non valido");
    const lineup: Lineup = {
      id,
      title: input.title?.trim() || `Formazione di ${me.name}`,
      authorId: me.id,
      formation: { blacks: fb.id, blancos: fw.id },
      slots: {
        blacks: Array.from({ length: fb.slots.length }, (_, i) => blacks[i] ?? null),
        blancos: Array.from({ length: fw.slots.length }, (_, i) => blancos[i] ?? null),
      },
      votes: [me.id],
      createdAt: new Date().toISOString(),
    };
    db.lineups.unshift(lineup);
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return { ok: true, id };
}

export async function toggleLineupVoteAction(lineupId: string): Promise<ActionResult> {
  const me = await currentPlayer();
  if (!me) return fail("Entra per votare");
  const mErr = await tryMutate((db) => {
    const l = db.lineups.find((x) => x.id === lineupId);
    if (!l) throw new Error("Formazione non trovata");
    if (l.votes.includes(me.id)) l.votes = l.votes.filter((v) => v !== me.id);
    else l.votes.push(me.id);
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok();
}

export async function deleteLineupAction(lineupId: string): Promise<ActionResult> {
  const me = await currentPlayer();
  const admin = await isAdmin();
  const mErr = await tryMutate((db) => {
    const l = db.lineups.find((x) => x.id === lineupId);
    if (!l) return;
    if (!admin && l.authorId !== me?.id) throw new Error("Non puoi eliminare questa formazione");
    db.lineups = db.lineups.filter((x) => x.id !== lineupId);
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok();
}

/* ---------------- matches ---------------- */

export async function voteMvpAction(matchId: string, playerId: string): Promise<ActionResult> {
  const me = await currentPlayer();
  if (!me) return fail("Entra per votare l'MVP");
  if (me.id === playerId) return fail("Non puoi votarti MVP da solo 😄");
  const mErr = await tryMutate((db) => {
    const m = db.matches.find((x) => x.id === matchId);
    if (!m) throw new Error("Partita non trovata");
    if (![...m.blacks, ...m.blancos].includes(playerId)) throw new Error("Il giocatore non ha giocato questa partita");
    m.mvpVotes = m.mvpVotes.filter((v) => v.voterId !== me.id);
    m.mvpVotes.push({ voterId: me.id, playerId });
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok("MVP votato!");
}

export async function saveMatchAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await isManager())) return fail("Solo l'admin o i capitani possono salvare le partite");
  const id = str(formData.get("id"));
  const date = str(formData.get("date")) || new Date().toISOString().slice(0, 10);
  const title = str(formData.get("title"));
  const notes = str(formData.get("notes"));
  const played = str(formData.get("played")) === "1";
  const blacksScore = played ? num(formData.get("blacksScore")) : null;
  const blancosScore = played ? num(formData.get("blancosScore")) : null;
  const blacks = formData.getAll("blacks").map(String);
  const blancos = formData.getAll("blancos").map(String).filter((x) => !blacks.includes(x));
  const stats: MatchPlayerStat[] = [];
  for (const pid of [...blacks, ...blancos]) {
    const goals = num(formData.get(`goals_${pid}`));
    const assists = num(formData.get(`assists_${pid}`));
    if (goals || assists) stats.push({ playerId: pid, goals: Math.max(0, goals), assists: Math.max(0, assists) });
  }
  let savedId = id;
  let isNew = false;
  let lineupChanged = false;
  const snap: { db: DB | null } = { db: null };
  const mErr = await tryMutate((db) => {
    snap.db = db;
    const existing = id ? db.matches.find((m) => m.id === id) : undefined;
    if (existing) {
      const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
      lineupChanged = !same(existing.blacks, blacks) || !same(existing.blancos, blancos);
      Object.assign(existing, { date, title, notes, blacksScore, blancosScore, blacks, blancos, stats });
    } else {
      isNew = true;
      const m: Match = {
        id: newId("m_"),
        date,
        title,
        notes,
        blacksScore,
        blancosScore,
        blacks,
        blancos,
        stats,
        mvpVotes: [],
        createdAt: new Date().toISOString(),
      };
      savedId = m.id;
      db.matches.unshift(m);
    }
    db.matches.sort((a, b) => b.date.localeCompare(a.date));
  });
  if (mErr) return fail(mErr);
  if (snap.db && (isNew || lineupChanged)) {
    const when = new Date(date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    const label = title ? `${title} (${when})` : `Partita di ${when}`;
    await notifyPlayers(snap.db, (p) => {
      const inBlacks = blacks.includes(p.id);
      const inBlancos = blancos.includes(p.id);
      const body = inBlacks
        ? `${label}: sei convocato con i BLACKS ⚫`
        : inBlancos
          ? `${label}: sei convocato con i BLANCOS ⚪`
          : `${label}: formazioni confermate, non sei tra i convocati.`;
      return { title: isNew ? "Nuova partita! ⚽" : "Formazioni aggiornate", body, url: `/partite/${savedId}`, tag: `match-${savedId}` };
    }).catch(() => undefined);
  }
  revalidateAll();
  redirect(`/partite/${savedId}`);
}

export async function deleteMatchAction(matchId: string): Promise<ActionResult> {
  if (!(await isManager())) return fail("Solo l'admin o i capitani");
  const mErr = await tryMutate((db) => {
    db.matches = db.matches.filter((m) => m.id !== matchId);
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  redirect("/partite");
}

/* ---------------- admin: players & settings ---------------- */

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function savePlayerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin può modificare i giocatori");
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) return fail("Il nome è obbligatorio");
  const nickname = str(formData.get("nickname"));
  const position = str(formData.get("position")) as Position;
  if (!POSITIONS.includes(position)) return fail("Ruolo non valido");
  const teamRaw = str(formData.get("team"));
  const team: TeamId | null = teamRaw === "blacks" || teamRaw === "blancos" ? teamRaw : null;
  const number = num(formData.get("number"), 0) || undefined;
  const pinInput = str(formData.get("pin"));
  if (pinInput && !/^\d{4}$/.test(pinInput)) return fail("Il PIN deve essere di 4 cifre");
  const isAdminFlag = str(formData.get("isAdmin")) === "1";
  const isCaptain = str(formData.get("isCaptain")) === "1";

  let photo: string | undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (file.size > 6 * 1024 * 1024) return fail("Foto troppo grande (max 6MB)");
    const bytes = Buffer.from(await file.arrayBuffer());
    photo = await savePhoto(bytes, file.name || "foto.jpg", file.type || "image/jpeg");
  }

  const mErr = await tryMutate((db) => {
    const existing = id ? db.players.find((p) => p.id === id) : undefined;
    if (existing) {
      existing.name = name;
      existing.nickname = nickname || undefined;
      existing.position = position;
      existing.team = team;
      existing.number = number;
      existing.isAdmin = isAdminFlag;
      existing.isCaptain = isCaptain;
      if (pinInput) existing.pin = pinInput;
      if (photo) existing.photo = photo;
    } else {
      const p: Player = {
        id: newId("p_"),
        name,
        nickname: nickname || undefined,
        position,
        team,
        number,
        photo,
        pin: pinInput || randomPin(),
        isAdmin: isAdminFlag,
        isCaptain,
        createdAt: new Date().toISOString(),
      };
      db.players.push(p);
    }
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok(id ? "Giocatore aggiornato" : "Giocatore aggiunto");
}

export async function deletePlayerAction(playerId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin");
  const mErr = await tryMutate((db) => {
    db.players = db.players.filter((p) => p.id !== playerId);
    db.votes = db.votes.filter((v) => v.playerId !== playerId && v.voterId !== playerId);
    for (const m of db.matches) {
      m.blacks = m.blacks.filter((x) => x !== playerId);
      m.blancos = m.blancos.filter((x) => x !== playerId);
      m.stats = m.stats.filter((s) => s.playerId !== playerId);
      m.mvpVotes = m.mvpVotes.filter((v) => v.playerId !== playerId && v.voterId !== playerId);
    }
    for (const l of db.lineups) {
      l.slots.blacks = l.slots.blacks.map((x) => (x === playerId ? null : x));
      l.slots.blancos = l.slots.blancos.map((x) => (x === playerId ? null : x));
      l.votes = l.votes.filter((v) => v !== playerId);
    }
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok("Giocatore eliminato");
}

export async function saveSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin");
  const goldRareMin = num(formData.get("goldRareMin"), 80);
  const goldMin = num(formData.get("goldMin"), 70);
  if (goldMin >= goldRareMin) return fail("La soglia Oro deve essere minore della soglia Oro Rara");
  const votingOpen = str(formData.get("votingOpen")) === "1";
  const seasonName = str(formData.get("seasonName")) || "Stagione";
  const mErr = await tryMutate((db) => {
    db.settings = { goldRareMin, goldMin, votingOpen, seasonName };
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok("Impostazioni salvate");
}

export async function resetVotesAction(): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin");
  const mErr = await tryMutate((db) => {
    db.votes = [];
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok("Voti azzerati");
}

/* ---------------- bulk import ---------------- */

export async function bulkImportAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin");
  const text = str(formData.get("lines"));
  const parsed = text.split(/\r?\n/).map(parseBulkLine).filter((x): x is NonNullable<typeof x> => Boolean(x));
  if (!parsed.length) return fail("Nessun giocatore trovato nel testo");
  let added = 0;
  let updated = 0;
  const mErr = await tryMutate((db) => {
    for (const row of parsed) {
      const existing = db.players.find((p) => p.name.toLowerCase() === row.name.toLowerCase());
      if (existing) {
        if (row.position) existing.position = row.position;
        if (row.team) existing.team = row.team;
        if (row.isCaptain) existing.isCaptain = true;
        updated++;
        continue;
      }
      db.players.push({
        id: newId("p_"),
        name: row.name,
        position: row.position ?? "CEN",
        team: row.team,
        isCaptain: row.isCaptain,
        pin: randomPin(),
        createdAt: new Date().toISOString(),
      });
      added++;
    }
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok(`${added} giocatori aggiunti, ${updated} aggiornati`);
}

/* ---------------- calciomercato ---------------- */

export async function transferPlayerAction(input: { playerId: string; to: TeamId | null; note?: string }): Promise<ActionResult & { transfer?: Transfer }> {
  if (!(await isManager())) return fail("Solo l'admin e i capitani possono fare trasferimenti");
  const me = await currentPlayer();
  const to: TeamId | null = input.to === "blacks" || input.to === "blancos" ? input.to : null;
  let transfer: Transfer | undefined;
  const snap: { db: DB | null } = { db: null };
  const mErr = await tryMutate((db) => {
    const player = db.players.find((p) => p.id === input.playerId);
    if (!player) throw new Error("Giocatore non trovato");
    if (player.team === to) throw new Error(`${player.name} è già ${to ? "nei " + TEAM_LABEL[to] : "svincolato"}`);
    const rated = ratePlayer(player, db.votes, db.settings);
    transfer = {
      id: newId("t_"),
      playerId: player.id,
      from: player.team,
      to,
      byId: me?.id ?? null,
      fee: rated.value,
      overall: rated.overall,
      note: input.note?.trim().slice(0, 140) || undefined,
      createdAt: new Date().toISOString(),
    };
    player.team = to;
    db.transfers.unshift(transfer);
    snap.db = db;
  });
  if (mErr) return fail(mErr);
  const done = transfer as Transfer | undefined;
  if (snap.db && done) {
    const t = done;
    const name = snap.db.players.find((p) => p.id === t.playerId)?.name ?? "Un giocatore";
    const dest = t.to ? `passa ai ${TEAM_LABEL[t.to]}` : "resta svincolato";
    await notifyPlayers(snap.db, (p) => ({
      title: "Calciomercato 🔁",
      body: p.id === t.playerId ? `UFFICIALE: ${dest.replace("passa", "passi")}! Ti hanno pagato ${formatValue(t.fee)} crediti.` : `UFFICIALE: ${name} ${dest} per ${formatValue(t.fee)} crediti.`,
      url: "/mercato",
      tag: `transfer-${t.id}`,
    })).catch(() => undefined);
  }
  revalidateAll();
  return { ok: true, transfer };
}

export async function deleteTransferAction(transferId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin può cancellare uno storico");
  const mErr = await tryMutate((db) => {
    db.transfers = db.transfers.filter((t) => t.id !== transferId);
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok();
}

/* ---------------- push notifications ---------------- */

export async function subscribePushAction(sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<ActionResult> {
  const me = await currentPlayer();
  if (!me) return fail("Entra per attivare le notifiche");
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return fail("Sottoscrizione non valida");
  const mErr = await tryMutate((db) => {
    db.pushSubs = (db.pushSubs ?? []).filter((s) => s.endpoint !== sub.endpoint);
    db.pushSubs.push({ playerId: me.id, endpoint: sub.endpoint, keys: sub.keys, createdAt: new Date().toISOString() });
  });
  if (mErr) return fail(mErr);
  return ok("Notifiche attivate");
}

export async function unsubscribePushAction(endpoint: string): Promise<ActionResult> {
  const mErr = await tryMutate((db) => {
    db.pushSubs = (db.pushSubs ?? []).filter((s) => s.endpoint !== endpoint);
  });
  if (mErr) return fail(mErr);
  return ok("Notifiche disattivate");
}

export async function broadcastPushAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!(await isManager())) return fail("Solo l'admin e i capitani");
  const title = str(formData.get("title")) || "Arena Quadrifoglio";
  const body = str(formData.get("body"));
  if (!body) return fail("Scrivi un messaggio");
  const db = await getDb();
  const res = await notifyPlayers(db, () => ({ title: title.slice(0, 60), body: body.slice(0, 200), url: str(formData.get("url")) || "/" }));
  return ok(`Inviato a ${res.sent} dispositivi${res.failed ? `, ${res.failed} falliti` : ""}`);
}

export async function testPushAction(): Promise<ActionResult> {
  const me = await currentPlayer();
  if (!me) return fail("Entra prima");
  const db = await getDb();
  const res = await notifyPlayers(db, (p) => (p.id === me.id ? { title: "Arena Quadrifoglio", body: "Notifiche attive! Ti avviseremo per partite e mercato. ⚽", url: "/" } : null));
  return res.sent ? ok("Notifica di prova inviata") : fail("Nessuna notifica inviata: attiva le notifiche su questo dispositivo");
}

/* ---------------- seed demo data (admin, only when empty) ---------------- */

export async function seedDemoAction(): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Solo l'admin");
  const demo: { name: string; position: Position; team: TeamId }[] = [
    { name: "Beppe", position: "ATT", team: "blacks" },
    { name: "Marco", position: "CEN", team: "blacks" },
    { name: "Luca", position: "DIF", team: "blacks" },
    { name: "Andrea", position: "POR", team: "blacks" },
    { name: "Davide", position: "ATT", team: "blancos" },
    { name: "Simone", position: "CEN", team: "blancos" },
    { name: "Matteo", position: "DIF", team: "blancos" },
    { name: "Giovanni", position: "POR", team: "blancos" },
  ];
  const mErr = await tryMutate((db) => {
    if (db.players.length) throw new Error("Ci sono già giocatori: demo non caricata");
    db.players = demo.map((d, i) => ({
      id: newId("p_") + i,
      name: d.name,
      position: d.position,
      team: d.team,
      number: i + 1,
      pin: "1234",
      isCaptain: i === 0 || i === 4,
      createdAt: new Date().toISOString(),
    }));
    const ids = db.players.map((p) => p.id);
    for (const voter of ids) {
      for (const target of ids) {
        if (voter === target) continue;
        const base = 62 + (target.charCodeAt(target.length - 1) % 25);
        db.votes.push({
          voterId: voter,
          playerId: target,
          overall: Math.min(95, base + Math.floor(Math.random() * 8) - 4),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  });
  if (mErr) return fail(mErr);
  revalidateAll();
  return ok("Dati demo caricati (PIN di tutti: 1234)");
}
