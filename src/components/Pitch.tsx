"use client";

import { Formation } from "@/lib/formations";
import { Position, TeamId } from "@/lib/types";
import { photoUrl } from "@/lib/photo";

export interface LineupPlayer {
  id: string;
  name: string;
  position: Position;
  overall: number | null;
  team: TeamId | null;
  photo?: string;
}

export function balanceScore(a: (LineupPlayer | null)[], b: (LineupPlayer | null)[]) {
  const avg = (list: (LineupPlayer | null)[]) => {
    const v = list.filter((p): p is LineupPlayer => !!p && p.overall != null).map((p) => p.overall as number);
    return v.length ? Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 10) / 10 : null;
  };
  const blacks = avg(a);
  const blancos = avg(b);
  const diff = blacks != null && blancos != null ? Math.abs(blacks - blancos) : null;
  const score = diff == null ? 0 : Math.max(0, Math.round(100 - diff * 10));
  return { blacks, blancos, diff, score };
}

export function Pitch({
  team,
  formation,
  players,
  onSlotClick,
  activeIndex,
  compact,
}: {
  team: TeamId;
  formation: Formation;
  players: (LineupPlayer | null)[];
  onSlotClick?: (index: number) => void;
  activeIndex?: number;
  compact?: boolean;
}) {
  return (
    <div className={`pitch-grass relative w-full overflow-hidden rounded-2xl border-2 border-white/20 ${compact ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
      {/* pitch lines */}
      <div className="pointer-events-none absolute inset-3 rounded-sm border border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
      <div className="pointer-events-none absolute left-3 right-3 top-1/2 border-t border-white/30" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-16 w-1/2 -translate-x-1/2 border border-b-0 border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-3 h-16 w-1/2 -translate-x-1/2 border border-t-0 border-white/30" />

      {formation.slots.map((slot, i) => {
        const p = players[i];
        const url = p ? photoUrl(p) : null;
        const isActive = activeIndex === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSlotClick?.(i)}
            disabled={!onSlotClick}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
          >
            <div
              className={`relative flex items-center justify-center rounded-full border-2 shadow-lg transition ${compact ? "h-11 w-11" : "h-14 w-14"} ${
                p
                  ? team === "blacks"
                    ? "border-white/70 bg-black"
                    : "border-gold bg-white"
                  : "border-dashed border-white/50 bg-black/30"
              } ${isActive ? "ring-4 ring-teal-light" : ""} ${onSlotClick ? "hover:scale-105" : ""}`}
            >
              {p ? (
                url ? (
                  <img src={url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className={`font-display text-lg ${team === "blacks" ? "text-white" : "text-black"}`}>{p.name.slice(0, 1)}</span>
                )
              ) : (
                <span className="text-[10px] uppercase text-white/60">{slot.role}</span>
              )}
              {p && p.overall != null && (
                <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1 font-display text-[10px] font-bold text-black shadow">{p.overall}</span>
              )}
            </div>
            <span className="mt-1 max-w-[72px] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{p ? p.name : slot.role}</span>
          </button>
        );
      })}
    </div>
  );
}
