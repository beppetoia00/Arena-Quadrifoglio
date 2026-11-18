"use client";

import { useId } from "react";
import { Attrs, Player, Tier } from "@/lib/types";
import { ATTR_KEYS, ATTR_LABEL } from "@/lib/rating";
import { photoUrl } from "@/lib/photo";

export interface FutCardProps {
  player: Pick<Player, "name" | "nickname" | "position" | "team" | "photo" | "number">;
  overall: number | null;
  attrs: Attrs | null;
  tier: Tier;
  width?: number;
  className?: string;
  /** show "??" placeholder for overall */
  hidden?: boolean;
  glow?: boolean;
}

const THEMES: Record<
  Tier,
  { stops: [string, string, string, string]; ink: string; inkSoft: string; edge: string; sheen: string; label: string }
> = {
  "gold-rare": {
    stops: ["#fff4bf", "#f1d272", "#d2a93f", "#8f6a1a"],
    ink: "#2d1f05",
    inkSoft: "rgba(45,31,5,0.72)",
    edge: "#5c4310",
    sheen: "rgba(255,255,255,0.55)",
    label: "ORO RARA",
  },
  gold: {
    stops: ["#efd98e", "#dcbb5c", "#bb922f", "#86661a"],
    ink: "#2d1f05",
    inkSoft: "rgba(45,31,5,0.7)",
    edge: "#5c4310",
    sheen: "rgba(255,255,255,0.3)",
    label: "ORO",
  },
  "silver-rare": {
    stops: ["#ffffff", "#e3e8ee", "#b4bdc7", "#6f7a86"],
    ink: "#1f252d",
    inkSoft: "rgba(31,37,45,0.7)",
    edge: "#3f4852",
    sheen: "rgba(255,255,255,0.65)",
    label: "ARGENTO RARA",
  },
};

export const CARD_PATH =
  "M150 6 C205 6 245 16 274 30 L274 318 C274 354 258 374 228 388 L150 434 L72 388 C42 374 26 354 26 318 L26 30 C55 16 95 6 150 6 Z";

export function FutCard({ player, overall, attrs, tier, width = 300, className = "", hidden, glow }: FutCardProps) {
  const uid = useId().replace(/:/g, "");
  const t = THEMES[tier];
  const em = width / 30; // 1em = width/30 (10px at 300px)
  const height = (width * 440) / 300;
  const photo = photoUrl(player);
  const displayName = (player.nickname || player.name).toUpperCase();
  const ovrText = hidden || overall == null ? "??" : String(overall);

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width, height, fontSize: em, filter: glow ? `drop-shadow(0 0 ${em * 2.2}px ${tier === "silver-rare" ? "rgba(220,230,240,0.55)" : "rgba(255,215,90,0.6)"})` : undefined }}
    >
      <svg viewBox="0 0 300 440" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={t.stops[0]} />
            <stop offset="0.35" stopColor={t.stops[1]} />
            <stop offset="0.8" stopColor={t.stops[2]} />
            <stop offset="1" stopColor={t.stops[3]} />
          </linearGradient>
          <linearGradient id={`s-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.42" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.5" stopColor={t.sheen} />
            <stop offset="0.58" stopColor="rgba(255,255,255,0)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={`b-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.18)" />
          </linearGradient>
          <clipPath id={`c-${uid}`}>
            <path d={CARD_PATH} />
          </clipPath>
          <clipPath id={`p-${uid}`}>
            <rect x="88" y="26" width="196" height="236" />
          </clipPath>
        </defs>
        <path d={CARD_PATH} fill={`url(#g-${uid})`} stroke={t.edge} strokeOpacity="0.35" strokeWidth="2" />
        <g clipPath={`url(#c-${uid})`}>
          <path d={CARD_PATH} fill={`url(#s-${uid})`} />
          <path d={CARD_PATH} fill={`url(#b-${uid})`} />
          {/* inner frame */}
          <path
            d="M150 18 C198 18 234 27 262 39 L262 314 C262 346 248 364 222 376 L150 418 L78 376 C52 364 38 346 38 314 L38 39 C66 27 102 18 150 18 Z"
            fill="none"
            stroke={t.ink}
            strokeOpacity="0.14"
            strokeWidth="1.2"
          />
          {/* photo */}
          <g clipPath={`url(#p-${uid})`}>
            {photo ? (
              <image href={photo} x="88" y="26" width="196" height="236" preserveAspectRatio="xMidYMax meet" />
            ) : (
              <g transform="translate(186 150)" fill={t.ink} fillOpacity="0.22">
                <circle cx="0" cy="-32" r="34" />
                <path d="M-70 110 C-70 40 -40 18 0 18 C40 18 70 40 70 110 Z" />
              </g>
            )}
          </g>
          {/* divider */}
          <line x1="52" y1="266" x2="248" y2="266" stroke={t.ink} strokeOpacity="0.35" strokeWidth="1.2" />
          <line x1="150" y1="304" x2="150" y2="376" stroke={t.ink} strokeOpacity="0.25" strokeWidth="1" />
          <line x1="60" y1="390" x2="240" y2="390" stroke={t.ink} strokeOpacity="0.25" strokeWidth="1" />
        </g>
      </svg>

      {/* left column: overall, position, crest */}
      <div className="absolute flex flex-col items-center" style={{ left: "3.6em", top: "3.2em", width: "6em", color: t.ink }}>
        <div className="font-display font-bold leading-none" style={{ fontSize: "5.6em", letterSpacing: "-0.03em" }}>
          {ovrText}
        </div>
        <div className="font-display font-semibold leading-none" style={{ fontSize: "1.9em", marginTop: "0.1em", letterSpacing: "0.06em" }}>
          {player.position}
        </div>
        <div style={{ width: "1.8em", height: "0.12em", background: t.ink, opacity: 0.5, margin: "0.9em 0" }} />
        <img
          src={player.team ? `/brand/${player.team}.png` : "/brand/clover.png"}
          alt=""
          style={{ width: "4.2em", height: "4.2em", objectFit: "contain", filter: "drop-shadow(0 0.2em 0.4em rgba(0,0,0,0.35))" }}
        />
        <img src="/brand/clover.png" alt="" style={{ width: "2.4em", height: "2.4em", objectFit: "contain", marginTop: "0.9em", opacity: 0.9 }} />
      </div>

      {/* name */}
      <div className="absolute left-0 right-0 px-[4em] text-center" style={{ top: "27.1em" }}>
        <div className="truncate font-display font-bold uppercase leading-none" style={{ fontSize: "2.3em", color: t.ink, letterSpacing: "0.04em" }}>
          {displayName}
        </div>
      </div>

      {/* attributes */}
      <div className="absolute grid grid-cols-2" style={{ left: "5.2em", right: "5.2em", top: "30.8em", rowGap: "0.35em", columnGap: "3em", color: t.ink }}>
        {ATTR_KEYS.map((k) => (
          <div key={k} className="flex items-baseline gap-[0.5em] font-display leading-none" style={{ fontSize: "1.75em" }}>
            <span className="font-bold" style={{ minWidth: "1.5em", textAlign: "right" }}>
              {hidden || !attrs ? "–" : attrs[k]}
            </span>
            <span style={{ opacity: 0.75, fontSize: "0.82em", letterSpacing: "0.06em" }}>{ATTR_LABEL[k]}</span>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="absolute left-0 right-0 text-center" style={{ top: "39.6em" }}>
        <span className="font-display uppercase leading-none" style={{ fontSize: "0.95em", letterSpacing: "0.32em", color: t.inkSoft }}>
          Arena Quadrifoglio
        </span>
      </div>
      <div className="absolute" style={{ right: "4.2em", top: "2.6em" }}>
        <span className="font-display uppercase leading-none" style={{ fontSize: "0.85em", letterSpacing: "0.2em", color: t.inkSoft }}>
          {t.label}
        </span>
      </div>
    </div>
  );
}
