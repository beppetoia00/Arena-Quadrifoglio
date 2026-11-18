import "server-only";
import { getDb } from "./db";
import { currentPlayer } from "./auth";
import { rateAll, RatedPlayer } from "./rating";
import { playerStats } from "./stats";
import { Player } from "./types";
import { VoteCard } from "@/components/VoteFlow";
import { Convocation } from "@/components/ConvocationCard";
import { DB } from "./types";
import { isPlayed } from "./stats";

/** Public (client-safe) fields of a player: never ship the PIN to the browser. */
export function publicPlayer(p: Player) {
  return {
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    position: p.position,
    team: p.team,
    number: p.number,
    photo: p.photo,
    isCaptain: p.isCaptain ?? false,
  };
}

export type PublicPlayer = ReturnType<typeof publicPlayer>;

export function toVoteCard(r: RatedPlayer): VoteCard {
  return {
    ...publicPlayer(r.player),
    overall: r.overall,
    attrs: r.attrs,
    tier: r.tier,
    votesCount: r.votesCount,
  };
}

export async function loadArena() {
  const [db, me] = await Promise.all([getDb(), currentPlayer()]);
  const rated = rateAll(db.players, db.votes, db.settings);
  const ratedById = new Map(rated.map((r) => [r.player.id, r]));
  const stats = playerStats(db.players, db.matches);
  return { db, me, rated, ratedById, stats };
}

/** The next match (today or in the future, not yet played) for a player, as a convocation notice. */
export function nextConvocation(db: DB, playerId: string): Convocation | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = db.matches
    .filter((m) => !isPlayed(m) && m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const m = upcoming[0];
  if (!m) return null;
  const team = m.blacks.includes(playerId) ? "blacks" : m.blancos.includes(playerId) ? "blancos" : null;
  return { matchId: m.id, date: m.date, title: m.title, team, isToday: m.date === today, isPast: false };
}
