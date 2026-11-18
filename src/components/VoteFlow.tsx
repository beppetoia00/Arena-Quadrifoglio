"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FutCard } from "./FutCard";
import { Pack } from "./Pack";
import { Attrs, Position, Settings, TeamId, Tier } from "@/lib/types";
import { ATTR_KEYS, ATTR_LABEL, attrsFromOverall, cardValue, formatValue, MAX_OVR, MIN_OVR, METAL_LABEL, TIER_LABEL, tierFor, tierMetal } from "@/lib/rating";
import { submitVoteAction } from "@/lib/actions";

export interface VoteCard {
  id: string;
  name: string;
  nickname?: string;
  position: Position;
  team: TeamId | null;
  photo?: string;
  overall: number | null;
  attrs: Attrs | null;
  tier: Tier;
  votesCount: number;
  myVote?: { overall: number; attrs?: Attrs };
}

type Phase = "pack" | "opening" | "walkout" | "reveal" | "rate" | "saved";

const TIER_FLARE: Record<Tier, string> = {
  "gold-rare": "radial-gradient(circle, rgba(255,230,140,0.95) 0%, rgba(233,197,91,0.5) 35%, transparent 70%)",
  gold: "radial-gradient(circle, rgba(240,210,120,0.9) 0%, rgba(200,160,60,0.45) 35%, transparent 70%)",
  "silver-rare": "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,210,220,0.5) 35%, transparent 70%)",
  silver: "radial-gradient(circle, rgba(240,243,246,0.9) 0%, rgba(180,190,200,0.45) 35%, transparent 70%)",
  "bronze-rare": "radial-gradient(circle, rgba(243,207,168,0.95) 0%, rgba(212,154,98,0.5) 35%, transparent 70%)",
  bronze: "radial-gradient(circle, rgba(220,180,140,0.9) 0%, rgba(191,135,87,0.45) 35%, transparent 70%)",
};

export function VoteFlow({
  queue,
  voted,
  settings,
}: {
  queue: VoteCard[];
  voted: VoteCard[];
  settings: Settings;
}) {
  const [remaining, setRemaining] = useState<VoteCard[]>(queue);
  const [done, setDone] = useState<VoteCard[]>(voted);
  const [current, setCurrent] = useState<VoteCard | null>(queue[0] ?? null);
  const [phase, setPhase] = useState<Phase>("pack");
  const [revote, setRevote] = useState(false);

  const start = useCallback((card: VoteCard, isRevote = false) => {
    setCurrent(card);
    setRevote(isRevote);
    setPhase(isRevote ? "rate" : "pack");
  }, []);

  const onSaved = (card: VoteCard, vote: { overall: number; attrs?: Attrs }) => {
    const updated = { ...card, myVote: vote };
    setRemaining((r) => r.filter((c) => c.id !== card.id));
    setDone((d) => [updated, ...d.filter((c) => c.id !== card.id)]);
    setCurrent(updated);
    setPhase("saved");
  };

  const next = () => {
    const nextCard = remaining.find((c) => c.id !== current?.id) ?? null;
    setRevote(false);
    setCurrent(nextCard);
    setPhase("pack");
  };

  if (!settings.votingOpen) {
    return (
      <div className="card-panel text-center">
        <div className="font-display text-2xl uppercase">Votazioni chiuse</div>
        <p className="mt-2 text-muted">L&apos;admin ha chiuso le votazioni. Le carte sono definitive!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {current ? (
        <PackOpening key={current.id} card={current} phase={phase} setPhase={setPhase} settings={settings} onSaved={onSaved} onNext={next} revote={revote} remainingCount={remaining.filter((c) => c.id !== current.id).length} />
      ) : (
        <div className="card-panel text-center">
          <div className="text-5xl">🏆</div>
          <div className="mt-2 font-display text-3xl uppercase">Hai votato tutti!</div>
          <p className="mt-1 text-muted">Puoi comunque cambiare un voto dalle carte qui sotto.</p>
        </div>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl uppercase tracking-wider text-muted">
            Già votati <span className="text-ink">({done.length})</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {done.map((c) => (
              <button key={c.id} onClick={() => start(c, true)} className="group flex flex-col items-center gap-1 rounded-xl p-2 transition hover:bg-surface-2">
                <FutCard player={c} overall={c.overall} attrs={c.attrs} tier={c.tier} width={140} />
                <div className="text-xs text-muted">
                  Il tuo voto: <span className="font-display text-base text-gold">{c.myVote?.overall}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-teal-light opacity-0 transition group-hover:opacity-100">Rivota</div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PackOpening({
  card,
  phase,
  setPhase,
  settings,
  onSaved,
  onNext,
  revote,
  remainingCount,
}: {
  card: VoteCard;
  phase: Phase;
  setPhase: (p: Phase) => void;
  settings: Settings;
  onSaved: (card: VoteCard, vote: { overall: number; attrs?: Attrs }) => void;
  onNext: () => void;
  revote: boolean;
  remainingCount: number;
}) {
  const [overall, setOverall] = useState<number>(card.myVote?.overall ?? 75);
  const [detailed, setDetailed] = useState<boolean>(Boolean(card.myVote?.attrs));
  const [attrs, setAttrs] = useState<Attrs>(card.myVote?.attrs ?? attrsFromOverall(card.myVote?.overall ?? 75, card.position));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const liveTier = tierFor(overall, settings);
  const liveAttrs = detailed ? attrs : attrsFromOverall(overall, card.position);

  // phases timeline
  useEffect(() => {
    if (phase === "opening") {
      const t = setTimeout(() => setPhase("walkout"), 1100);
      return () => clearTimeout(t);
    }
    if (phase === "walkout") {
      const t = setTimeout(() => setPhase("reveal"), 2600);
      return () => clearTimeout(t);
    }
    if (phase === "rate") {
      const t = setTimeout(() => {
        const el = document.getElementById("rate-panel");
        if (el && window.innerWidth < 768) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
      return () => clearTimeout(t);
    }
    if (phase === "reveal") {
      try {
        navigator.vibrate?.([30, 40, 80]);
      } catch {
        /* ignore */
      }
      confetti({ particleCount: 140, spread: 80, startVelocity: 45, origin: { y: 0.55 }, colors: ["#e9c55b", "#ffffff", "#009992", "#fff1a8"] });
      const t = setTimeout(() => setPhase("rate"), 1400);
      return () => clearTimeout(t);
    }
  }, [phase, setPhase]);

  const changeOverall = (v: number) => {
    setOverall(v);
    if (!detailed) setAttrs(attrsFromOverall(v, card.position));
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await submitVoteAction({ playerId: card.id, overall, attrs: detailed ? attrs : null }).catch((e: Error) => ({ ok: false as const, error: e.message }));
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ["#009992", "#1ec8bf", "#ffffff"] });
    onSaved(card, { overall, attrs: detailed ? attrs : undefined });
  };

  const walkoutTier: Tier = card.overall != null ? card.tier : "gold";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface/40" style={{ minHeight: 520 }}>
      {/* backdrop rays during walkout/reveal */}
      <AnimatePresence>
        {(phase === "walkout" || phase === "reveal") && (
          <motion.div key="rays" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
            <div className="rays absolute left-1/2 top-1/2 h-[1600px] w-[1600px] -translate-x-1/2 -translate-y-1/2 opacity-60" />
            <div className="absolute inset-0" style={{ background: TIER_FLARE[walkoutTier] }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center px-3 py-6 md:px-4 md:py-8">
        <div className="mb-4 text-center">
          <div className="font-display text-xs uppercase tracking-[0.35em] text-muted">
            {revote ? "Cambia il tuo voto" : phase === "pack" ? "Pacchetto giocatore" : phase === "rate" || phase === "saved" ? "Dai il tuo voto" : "Sbustando..."}
          </div>
          {remainingCount > 0 && phase === "pack" && (
            <div className="mt-1 text-sm text-muted">
              {remainingCount} {remainingCount === 1 ? "altro pacchetto" : "altri pacchetti"} dopo questo
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(phase === "pack" || phase === "opening") && (
            <motion.div
              key="pack"
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                phase === "opening"
                  ? { opacity: 1, scale: [1, 1.05, 1.08, 1.2], rotate: [0, -3, 3, -3, 3, -2, 2, 0], x: [0, -8, 8, -8, 8, -4, 4, 0] }
                  : { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0, scale: 1.8, filter: "brightness(4)" }}
              transition={phase === "opening" ? { duration: 1.1, ease: "easeInOut" } : { duration: 0.4 }}
            >
              <button
                onClick={() => {
                  if (phase !== "pack") return;
                  try {
                    navigator.vibrate?.(20);
                  } catch {
                    /* ignore */
                  }
                  setPhase("opening");
                }}
                className="group relative outline-none"
                aria-label="Apri il pacchetto"
              >
                <Pack />
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-teal/30 blur-3xl animate-pulse-glow" />
              </button>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="mt-6 font-display text-lg uppercase tracking-[0.3em] text-teal-light"
              >
                {phase === "pack" ? "Tocca per sbustare" : "..."}
              </motion.div>
            </motion.div>
          )}

          {phase === "walkout" && (
            <motion.div key="walkout" className="flex h-[420px] flex-col items-center justify-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.3 }}>
              <Walkout card={card} tier={walkoutTier} />
            </motion.div>
          )}

          {(phase === "reveal" || phase === "rate" || phase === "saved") && (
            <motion.div
              key="card"
              className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-12"
              initial={{ opacity: 0, rotateY: 90, scale: 0.6, y: 60 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              style={{ perspective: 1200 }}
            >
              <motion.div animate={phase === "reveal" ? { y: [0, -10, 0] } : {}} transition={{ repeat: phase === "reveal" ? Infinity : 0, duration: 2 }}>
                <FutCard
                  player={card}
                  overall={phase === "saved" ? overall : overall}
                  attrs={liveAttrs}
                  tier={liveTier}
                  width={280}
                  glow
                  hidden={false}
                />
                <div className="mt-3 text-center">
                  <span className="rounded-full border border-line bg-surface px-3 py-1 font-display text-xs uppercase tracking-widest text-muted">
                    {TIER_LABEL[liveTier]} · valore {formatValue(cardValue(overall))}
                  </span>
                </div>
              </motion.div>

              {(phase === "rate" || phase === "saved") && (
                <motion.div id="rate-panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md scroll-mt-20">
                  {phase === "rate" ? (
                    <div className="card-panel space-y-5">
                      <div>
                        <div className="font-display text-2xl uppercase">
                          {card.nickname || card.name}
                          <span className="ml-2 text-base text-muted">{card.position}</span>
                        </div>
                        <div className="text-sm text-muted">Che overall merita? Niente autovoto, niente pietà.</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button className="btn-ghost !px-3" onClick={() => changeOverall(Math.max(MIN_OVR, overall - 1))} aria-label="-1">
                          −
                        </button>
                        <div className="flex-1 text-center font-display text-7xl font-bold leading-none text-gold">{overall}</div>
                        <button className="btn-ghost !px-3" onClick={() => changeOverall(Math.min(MAX_OVR, overall + 1))} aria-label="+1">
                          +
                        </button>
                      </div>
                      <input
                        type="range"
                        className="ovr-slider"
                        min={MIN_OVR}
                        max={MAX_OVR}
                        value={overall}
                        onChange={(e) => changeOverall(Number(e.target.value))}
                      />
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted">
                        <span>Bronzo</span>
                        <span>Argento ≥ {settings.silverMin}</span>
                        <span>Oro ≥ {settings.goldMin}</span>
                        <span>Oro rara ≥ {settings.goldRareMin}</span>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                        <input
                          type="checkbox"
                          checked={detailed}
                          onChange={(e) => {
                            setDetailed(e.target.checked);
                            if (e.target.checked) setAttrs(attrsFromOverall(overall, card.position));
                          }}
                          className="h-4 w-4 accent-teal"
                        />
                        Voto dettagliato (velocità, tiro, passaggio...)
                      </label>

                      {detailed && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {ATTR_KEYS.map((k) => (
                            <label key={k} className="text-xs text-muted">
                              <div className="flex justify-between">
                                <span>{ATTR_LABEL[k]}</span>
                                <span className="font-display text-sm text-ink">{attrs[k]}</span>
                              </div>
                              <input
                                type="range"
                                min={30}
                                max={99}
                                value={attrs[k]}
                                onChange={(e) => setAttrs({ ...attrs, [k]: Number(e.target.value) })}
                                className="w-full accent-teal"
                              />
                            </label>
                          ))}
                        </div>
                      )}

                      {error && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}

                      <button className="btn-gold w-full !py-3 !text-lg" onClick={submit} disabled={saving}>
                        {saving ? "Salvo..." : revote ? "Aggiorna voto" : "Conferma voto"}
                      </button>
                    </div>
                  ) : (
                    <div className="card-panel space-y-4 text-center">
                      <div className="text-4xl">✅</div>
                      <div className="font-display text-2xl uppercase">Voto registrato</div>
                      <div className="text-muted">
                        Hai dato <span className="font-display text-xl text-gold">{overall}</span> a {card.nickname || card.name}.
                      </div>
                      <CommunityAverage card={card} myOverall={overall} />
                      <button className="btn-primary w-full !py-3 !text-lg" onClick={onNext}>
                        {remainingCount > 0 ? "Prossimo pacchetto →" : "Fatto!"}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CommunityAverage({ card, myOverall }: { card: VoteCard; myOverall: number }) {
  const est = useMemo(() => {
    // estimate the new average including my vote (server will have the exact value)
    if (card.myVote) return card.overall;
    if (card.overall == null) return myOverall;
    return Math.round((card.overall * card.votesCount + myOverall) / (card.votesCount + 1));
  }, [card, myOverall]);
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3 text-sm">
      <div className="text-muted">Media della community</div>
      <div className="font-display text-3xl text-ink">{est ?? "–"}</div>
      <div className="text-xs text-muted">{card.votesCount + (card.myVote ? 0 : 1)} voti</div>
    </div>
  );
}

function Walkout({ card, tier }: { card: VoteCard; tier: Tier }) {
  const items = [
    { key: "pos", delay: 0.1, node: <div className="font-display text-6xl font-bold text-white text-shadow">{card.position}</div> },
    {
      key: "team",
      delay: 0.9,
      node: (
        <img src={card.team ? `/brand/${card.team}.png` : "/brand/clover.png"} alt="" className="h-28 w-28 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]" />
      ),
    },
    {
      key: "tier",
      delay: 1.7,
      node: (
        <div className="font-display text-2xl uppercase tracking-[0.4em] text-white text-shadow">
          {METAL_LABEL[tierMetal(tier)]}{tier.endsWith("-rare") ? " Rara" : ""}
        </div>
      ),
    },
  ];
  return (
    <>
      {items.map((it) => (
        <motion.div key={it.key} initial={{ opacity: 0, y: 40, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: it.delay, type: "spring", stiffness: 160, damping: 12 }}>
          {it.node}
        </motion.div>
      ))}
    </>
  );
}
