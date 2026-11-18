"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FutCard } from "./FutCard";
import { Crest } from "./Crest";
import { transferPlayerAction } from "@/lib/actions";
import { formatValue } from "@/lib/rating";
import { TEAM_LABEL, TeamId, Transfer } from "@/lib/types";
import { VoteCard } from "./VoteFlow";

type Card = VoteCard & { value: number };

export function TransferMarket({ players, canManage, meName }: { players: Card[]; canManage: boolean; meName: string | null }) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [dest, setDest] = useState<TeamId | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [anim, setAnim] = useState<{ card: Card; from: TeamId | null; to: TeamId | null; fee: number } | null>(null);
  const [filter, setFilter] = useState<"all" | TeamId | "free">("all");

  const list = useMemo(
    () => players.filter((p) => (filter === "all" ? true : filter === "free" ? !p.team : p.team === filter)).sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0)),
    [players, filter],
  );

  const pick = (c: Card) => {
    setSelected(c);
    setDest(c.team === "blacks" ? "blancos" : "blacks");
    setError(null);
  };

  const confirm = () => {
    if (!selected) return;
    setError(null);
    start(async () => {
      const res = await transferPlayerAction({ playerId: selected.id, to: dest, note });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAnim({ card: { ...selected, team: dest }, from: selected.team, to: dest, fee: res.transfer?.fee ?? selected.value });
      setSelected(null);
      setNote("");
    });
  };

  if (!canManage) return null;

  return (
    <>
      <section className="card-panel space-y-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider">Nuovo trasferimento</h2>
          <p className="text-sm text-muted">{meName ? `Ciao ${meName}, ` : ""}scegli il giocatore e la squadra di destinazione. Il costo è il valore attuale della carta.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {(
            [
              ["all", "Tutti"],
              ["blacks", "Blacks"],
              ["blancos", "Blancos"],
              ["free", "Svincolati"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full px-3 py-1 font-display text-xs uppercase tracking-wider ${filter === k ? "bg-teal text-white" : "border border-line text-muted"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {list.map((c) => (
            <button key={c.id} onClick={() => pick(c)} className={`flex flex-col items-center rounded-xl p-1 transition ${selected?.id === c.id ? "bg-teal/20 ring-2 ring-teal-light" : "hover:bg-surface-2"}`}>
              <FutCard player={c} overall={c.overall} attrs={c.attrs} tier={c.tier} width={96} />
              <div className="mt-1 text-[10px] text-muted">{formatValue(c.value)}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl border border-teal/40 bg-teal/5 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-display text-lg uppercase">{selected.nickname || selected.name}</div>
              <div className="flex items-center gap-2 text-sm">
                <Crest team={selected.team} size={22} /> {selected.team ? TEAM_LABEL[selected.team] : "Svincolato"}
                <span className="text-muted">→</span>
                <select value={dest ?? ""} onChange={(e) => setDest((e.target.value || null) as TeamId | null)} className="input !w-auto !py-1 text-sm">
                  <option value="blacks">Blacks</option>
                  <option value="blancos">Blancos</option>
                  <option value="">Svincolato</option>
                </select>
              </div>
              <div className="ml-auto font-display text-xl text-gold">{formatValue(selected.value)}</div>
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} className="input mt-3" placeholder="Nota (opzionale): es. scambio per un cornetto" />
            {error && <div className="mt-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}
            <div className="mt-3 flex gap-2">
              <button onClick={confirm} disabled={pending || selected.team === dest} className="btn-gold flex-1">
                {pending ? "..." : "Ufficializza trasferimento"}
              </button>
              <button onClick={() => setSelected(null)} className="btn-ghost">
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>{anim && <TransferAnimation {...anim} onClose={() => setAnim(null)} />}</AnimatePresence>
    </>
  );
}

export function TransferAnimation({ card, from, to, fee, onClose }: { card: Card; from: TeamId | null; to: TeamId | null; fee: number; onClose: () => void }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-black/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => stage === 2 && onClose()}
    >
      <div className="rays absolute left-1/2 top-1/2 h-[1600px] w-[1600px] -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative mb-6 font-display text-sm uppercase tracking-[0.5em] text-teal-light">
        Calciomercato · Arena Quadrifoglio
      </motion.div>

      <div className="relative flex w-full max-w-xl items-center justify-between">
        <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: stage >= 1 ? 0.45 : 1, scale: stage >= 1 ? 0.85 : 1 }} className="flex flex-col items-center gap-2">
          <Crest team={from} size={96} />
          <span className="font-display uppercase tracking-widest text-white">{from ? TEAM_LABEL[from] : "Svincolato"}</span>
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 z-10"
          initial={{ x: "-230%", y: "-50%", scale: 0.6, rotate: -10, opacity: 0 }}
          animate={
            stage === 0
              ? { x: "-50%", y: "-50%", scale: 1, rotate: 0, opacity: 1 }
              : { x: "130%", y: "-50%", scale: 0.9, rotate: 8, opacity: 1 }
          }
          transition={{ type: "spring", stiffness: 90, damping: 14, duration: 0.9 }}
          onAnimationComplete={() => {
            if (stage === 0) setTimeout(() => setStage(1), 500);
            else if (stage === 1) {
              setStage(2);
              confetti({ particleCount: 180, spread: 100, startVelocity: 50, origin: { y: 0.5 }, colors: ["#e9c55b", "#ffffff", "#009992", "#000000"] });
            }
          }}
        >
          <FutCard player={card} overall={card.overall} attrs={card.attrs} tier={card.tier} width={190} glow />
        </motion.div>

        <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1, scale: stage === 2 ? 1.15 : 1 }} className="flex flex-col items-center gap-2">
          <Crest team={to} size={96} />
          <span className="font-display uppercase tracking-widest text-white">{to ? TEAM_LABEL[to] : "Svincolato"}</span>
        </motion.div>
      </div>

      <AnimatePresence>
        {stage === 2 && (
          <motion.div key="stamp" initial={{ scale: 3, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="relative mt-10 text-center">
            <div className="inline-block rounded-xl border-4 border-gold px-6 py-2 font-display text-5xl font-bold uppercase tracking-[0.2em] text-gold shadow-[0_0_40px_rgba(233,197,91,0.6)]">
              Ufficiale
            </div>
            <div className="mt-4 font-display text-2xl uppercase text-white">
              {card.nickname || card.name} <span className="text-muted">→</span> {to ? TEAM_LABEL[to] : "svincolato"}
            </div>
            <div className="text-gold">per {formatValue(fee)} crediti</div>
            <button onClick={onClose} className="btn-primary mt-6">
              Chiudi
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TransferRow({ t, player, byName }: { t: Transfer; player: Card | null; byName: string | null }) {
  return (
    <li className="card-panel flex items-center gap-3 !p-3">
      {player ? (
        <FutCard player={player} overall={player.overall} attrs={player.attrs} tier={player.tier} width={64} />
      ) : (
        <div className="h-[94px] w-16 rounded bg-surface-2" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg uppercase">{player?.nickname || player?.name || "Giocatore eliminato"}</div>
        <div className="flex items-center gap-1.5 text-sm">
          <Crest team={t.from} size={18} /> <span className="text-muted">{t.from ? TEAM_LABEL[t.from] : "Svincolato"}</span>
          <span className="text-teal-light">→</span>
          <Crest team={t.to} size={18} /> <span>{t.to ? TEAM_LABEL[t.to] : "Svincolato"}</span>
        </div>
        <div className="text-[11px] text-muted">
          {new Date(t.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
          {byName ? ` · ufficializzato da ${byName}` : " · admin"}
          {t.note ? ` · “${t.note}”` : ""}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-xl text-gold">{formatValue(t.fee)}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted">OVR {t.overall ?? "–"}</div>
      </div>
    </li>
  );
}
