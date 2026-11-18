"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FORMATIONS, getFormation } from "@/lib/formations";
import { TEAM_LABEL, TeamId } from "@/lib/types";
import { PublicPlayer } from "@/lib/view";
import { createLineupAction } from "@/lib/actions";
import { Pitch, balanceScore, LineupPlayer } from "./Pitch";

type P = PublicPlayer & { overall: number | null };

export function LineupBuilder({ players }: { players: P[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [formation, setFormation] = useState<{ blacks: string; blancos: string }>({ blacks: "7-2-3-1", blancos: "7-2-3-1" });
  const [slots, setSlots] = useState<{ blacks: (string | null)[]; blancos: (string | null)[] }>({
    blacks: Array(7).fill(null),
    blancos: Array(7).fill(null),
  });
  const [picking, setPicking] = useState<{ team: TeamId; index: number } | null>(null);
  const [onlyTeam, setOnlyTeam] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const used = new Set([...slots.blacks, ...slots.blancos].filter(Boolean) as string[]);

  const changeFormation = (team: TeamId, id: string) => {
    const f = getFormation(id);
    setFormation({ ...formation, [team]: f.id });
    setSlots({ ...slots, [team]: Array.from({ length: f.slots.length }, (_, i) => slots[team][i] ?? null) });
  };

  const assign = (pid: string | null) => {
    if (!picking) return;
    const next = { blacks: [...slots.blacks], blancos: [...slots.blancos] };
    // remove from anywhere else
    if (pid) {
      next.blacks = next.blacks.map((x) => (x === pid ? null : x));
      next.blancos = next.blancos.map((x) => (x === pid ? null : x));
    }
    next[picking.team][picking.index] = pid;
    setSlots(next);
    setPicking(null);
  };

  const autoFill = () => {
    const next = { blacks: [...slots.blacks], blancos: [...slots.blancos] };
    for (const team of ["blacks", "blancos"] as TeamId[]) {
      const f = getFormation(formation[team]);
      const pool = players.filter((p) => p.team === team && !used.has(p.id) && !next[team].includes(p.id));
      f.slots.forEach((slot, i) => {
        if (next[team][i]) return;
        const idx = pool.findIndex((p) => p.position === slot.role);
        const pick = idx >= 0 ? pool.splice(idx, 1)[0] : pool.shift();
        if (pick) next[team][i] = pick.id;
      });
    }
    setSlots(next);
  };

  const toLineupPlayers = (team: TeamId): (LineupPlayer | null)[] =>
    slots[team].map((pid) => {
      const p = pid ? byId.get(pid) : undefined;
      return p ? { id: p.id, name: p.nickname || p.name, position: p.position, overall: p.overall, team: p.team, photo: p.photo } : null;
    });

  const blacksLP = toLineupPlayers("blacks");
  const blancosLP = toLineupPlayers("blancos");
  const balance = balanceScore(blacksLP, blancosLP);

  const save = () => {
    setError(null);
    start(async () => {
      const res = await createLineupAction({ title, formation, slots });
      if (!res.ok) setError(res.error);
      else router.push("/formazioni");
    });
  };

  const candidates = picking
    ? players
        .filter((p) => !onlyTeam || p.team === picking.team || !p.team)
        .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
    : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="label">Nome formazione</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Es. La formazione perfetta di venerdì" />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={autoFill} className="btn-ghost w-full">
            ✨ Riempi automaticamente
          </button>
        </div>
      </div>

      <BalanceBar balance={balance} />

      <div className="grid gap-6 md:grid-cols-2">
        {(["blacks", "blancos"] as TeamId[]).map((team) => (
          <div key={team} className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={`/brand/${team}.png`} alt="" className="h-9 w-9 object-contain" />
              <span className="font-display text-xl uppercase">{TEAM_LABEL[team]}</span>
              <select value={formation[team]} onChange={(e) => changeFormation(team, e.target.value)} className="input ml-auto !w-auto !py-1.5 text-sm">
                {FORMATIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <Pitch
              team={team}
              formation={getFormation(formation[team])}
              players={team === "blacks" ? blacksLP : blancosLP}
              onSlotClick={(index) => setPicking({ team, index })}
              activeIndex={picking?.team === team ? picking.index : undefined}
            />
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}
      <button onClick={save} disabled={pending} className="btn-gold w-full !py-3 !text-lg">
        {pending ? "Salvo..." : "Pubblica formazione"}
      </button>

      {picking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setPicking(null)}>
          <div className="glass max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-lg uppercase">
                Scegli per {TEAM_LABEL[picking.team]} · {getFormation(formation[picking.team]).slots[picking.index].role}
              </div>
              <label className="flex items-center gap-1 text-xs text-muted">
                <input type="checkbox" checked={onlyTeam} onChange={(e) => setOnlyTeam(e.target.checked)} className="accent-teal" /> solo {TEAM_LABEL[picking.team]}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {candidates.map((p) => {
                const taken = used.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => assign(p.id)}
                    className={`flex items-center gap-2 rounded-xl border border-line bg-surface p-2 text-left text-sm hover:border-teal ${taken ? "opacity-50" : ""}`}
                  >
                    <span className={`font-display text-lg ${p.overall != null && p.overall >= 70 ? "text-gold" : "text-silver"}`}>{p.overall ?? "–"}</span>
                    <span className="flex-1 truncate">{p.nickname || p.name}</span>
                    <span className="text-[10px] text-muted">{p.position}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => assign(null)} className="btn-ghost mt-3 w-full">
              Svuota posizione
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BalanceBar({ balance }: { balance: ReturnType<typeof balanceScore> }) {
  return (
    <div className="card-panel">
      <div className="flex items-center justify-between text-sm">
        <span>
          Blacks <span className="font-display text-xl text-gold">{balance.blacks ?? "–"}</span>
        </span>
        <span className="text-center">
          <span className="font-display text-2xl text-teal-light">{balance.score}%</span>
          <span className="block text-[10px] uppercase tracking-widest text-muted">equilibrio</span>
        </span>
        <span>
          <span className="font-display text-xl text-gold">{balance.blancos ?? "–"}</span> Blancos
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-gold to-teal-light" style={{ width: `${balance.score}%` }} />
      </div>
    </div>
  );
}
