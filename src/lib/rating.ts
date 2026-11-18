import { Attrs, Player, Position, Settings, Tier, Vote } from "./types";

export const ATTR_KEYS: (keyof Attrs)[] = ["pac", "sho", "pas", "dri", "def", "phy"];
export const ATTR_LABEL: Record<keyof Attrs, string> = {
  pac: "VEL",
  sho: "TIR",
  pas: "PAS",
  dri: "DRI",
  def: "DIF",
  phy: "FIS",
};

export const MIN_OVR = 40;
export const MAX_OVR = 99;

const clamp = (n: number, lo = 30, hi = 99) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Average of community votes, rounded. null when nobody voted yet. */
export function computeOverall(votes: Vote[]): number | null {
  if (!votes.length) return null;
  const sum = votes.reduce((a, v) => a + v.overall, 0);
  return clamp(sum / votes.length, MIN_OVR, MAX_OVR);
}

export function tierFor(overall: number | null, settings: Settings): Tier {
  if (overall == null) return "silver-rare";
  if (overall >= settings.goldRareMin) return "gold-rare";
  if (overall >= settings.goldMin) return "gold";
  if (overall >= settings.silverRareMin) return "silver-rare";
  if (overall >= settings.silverMin) return "silver";
  if (overall >= settings.bronzeRareMin) return "bronze-rare";
  return "bronze";
}

export const TIER_ORDER: Tier[] = ["gold-rare", "gold", "silver-rare", "silver", "bronze-rare", "bronze"];
/** Metal family of a tier: for colours and labels */
export function tierMetal(tier: Tier): "gold" | "silver" | "bronze" {
  return tier.startsWith("gold") ? "gold" : tier.startsWith("silver") ? "silver" : "bronze";
}
export const METAL_LABEL = { gold: "Oro", silver: "Argento", bronze: "Bronzo" } as const;

export const TIER_LABEL: Record<Tier, string> = {
  "gold-rare": "Oro Rara",
  gold: "Oro",
  "silver-rare": "Argento Rara",
  silver: "Argento",
  "bronze-rare": "Bronzo Rara",
  bronze: "Bronzo",
};

/** Market value of the card, FUT-style exponential curve. */
export function cardValue(overall: number | null): number {
  if (overall == null) return 0;
  const raw = 1000 * Math.pow(1.2, overall - 60);
  // round to 3 significant digits for nice numbers
  const digits = Math.floor(Math.log10(raw));
  const step = Math.pow(10, Math.max(0, digits - 2));
  return Math.max(500, Math.round(raw / step) * step);
}

export function formatValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1).replace(/\.?0+$/, "")}K`;
  return String(n);
}

const PROFILE: Record<Position, Attrs> = {
  POR: { pac: -8, sho: -25, pas: -5, dri: -10, def: 4, phy: 3 },
  DIF: { pac: -2, sho: -12, pas: -3, dri: -6, def: 5, phy: 4 },
  CEN: { pac: -1, sho: -4, pas: 4, dri: 3, def: -3, phy: 0 },
  ATT: { pac: 4, sho: 5, pas: -3, dri: 3, def: -15, phy: -1 },
};

/** Attributes derived from the overall and the position profile. */
export function attrsFromOverall(overall: number, position: Position): Attrs {
  const p = PROFILE[position];
  const out = {} as Attrs;
  for (const k of ATTR_KEYS) out[k] = clamp(overall + p[k]);
  return out;
}

/**
 * Card attributes: average of the detailed votes when voters provided them,
 * otherwise derived from the overall.
 */
export function computeAttrs(player: Player, votes: Vote[], overall: number | null): Attrs | null {
  if (overall == null) return null;
  const detailed = votes.filter((v) => v.attrs);
  if (!detailed.length) return attrsFromOverall(overall, player.position);
  const out = {} as Attrs;
  for (const k of ATTR_KEYS) {
    const sum = detailed.reduce((a, v) => a + (v.attrs as Attrs)[k], 0);
    out[k] = clamp(sum / detailed.length);
  }
  return out;
}

export interface RatedPlayer {
  player: Player;
  overall: number | null;
  votesCount: number;
  attrs: Attrs | null;
  tier: Tier;
  value: number;
}

export function ratePlayer(player: Player, allVotes: Vote[], settings: Settings): RatedPlayer {
  const votes = allVotes.filter((v) => v.playerId === player.id && v.voterId !== player.id);
  const overall = computeOverall(votes);
  return {
    player,
    overall,
    votesCount: votes.length,
    attrs: computeAttrs(player, votes, overall),
    tier: tierFor(overall, settings),
    value: cardValue(overall),
  };
}

export function rateAll(players: Player[], votes: Vote[], settings: Settings): RatedPlayer[] {
  return players
    .map((p) => ratePlayer(p, votes, settings))
    .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1) || a.player.name.localeCompare(b.player.name));
}

export function avgOverall(rated: (RatedPlayer | undefined)[]): number | null {
  const vals = rated.filter((r): r is RatedPlayer => !!r && r.overall != null).map((r) => r.overall as number);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
