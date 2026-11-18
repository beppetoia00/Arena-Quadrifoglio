"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crest } from "./Crest";
import { TEAM_LABEL, TeamId } from "@/lib/types";

export interface Convocation {
  matchId: string;
  date: string; // yyyy-mm-dd
  title?: string;
  team: TeamId | null; // null = not called up
  isToday: boolean;
  isPast: boolean;
}

function whenLabel(c: Convocation) {
  if (c.isToday) return "Oggi";
  const d = new Date(c.date + "T12:00:00");
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

/** Animated "today you play with ..." notice for the logged-in player. */
export function ConvocationCard({ c, name }: { c: Convocation; name: string }) {
  const when = whenLabel(c);
  const isBlacks = c.team === "blacks";
  return (
    <Link href={`/partite/${c.matchId}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
        className={`relative overflow-hidden rounded-3xl border p-4 ${
          c.team
            ? isBlacks
              ? "border-white/20 bg-gradient-to-br from-black via-[#111] to-surface"
              : "border-gold/40 bg-gradient-to-br from-[#f5efdc] via-[#e9dcb0] to-[#cdb064] text-black"
            : "border-line bg-surface/70"
        }`}
      >
        {c.team && (
          <motion.div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
            style={{ background: isBlacks ? "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)" : "radial-gradient(circle, rgba(255,255,255,0.7), transparent 70%)" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
        )}
        <div className="relative flex items-center gap-4">
          <motion.div
            initial={{ rotate: -20, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 12 }}
          >
            <Crest team={c.team} size={72} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${c.team ? (isBlacks ? "text-teal-light" : "text-[#5a4410]") : "text-muted"}`}>
              {c.team ? "Convocazione ufficiale" : "Prossima partita"}
            </div>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="font-display text-2xl font-bold uppercase leading-tight"
            >
              {c.team ? (
                <>
                  {when} giochi con i <span className={isBlacks ? "text-white" : "text-[#3b2a0a]"}>{TEAM_LABEL[c.team]}</span>
                </>
              ) : (
                <>
                  {when} c&apos;è partita: <span className="text-muted">non sei tra i convocati</span>
                </>
              )}
            </motion.div>
            <div className={`text-xs ${c.team ? (isBlacks ? "text-white/60" : "text-black/60") : "text-muted"}`}>
              {c.title ? `${c.title} · ` : ""}
              {name}, {c.team ? "preparati: tocca per vedere le formazioni →" : "tocca per vedere i convocati →"}
            </div>
          </div>
          {c.team && (
            <motion.div
              initial={{ scale: 2.5, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: -10 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 16 }}
              className={`hidden shrink-0 rounded-md border-2 px-2 py-0.5 font-display text-xs font-bold uppercase tracking-widest sm:block ${isBlacks ? "border-teal-light text-teal-light" : "border-[#3b2a0a] text-[#3b2a0a]"}`}
            >
              Convocato
            </motion.div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
