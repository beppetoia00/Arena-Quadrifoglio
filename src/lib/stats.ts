import { Match, Player, TeamId } from "./types";

export interface PlayerStats {
  playerId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  mvps: number;
  points: number; // 3 per win, 1 per draw
}

export const isPlayed = (m: Match) => m.blacksScore != null && m.blancosScore != null;

export function matchWinner(m: Match): TeamId | "draw" | null {
  if (!isPlayed(m)) return null;
  if ((m.blacksScore as number) > (m.blancosScore as number)) return "blacks";
  if ((m.blacksScore as number) < (m.blancosScore as number)) return "blancos";
  return "draw";
}

/** Players with the most MVP votes (ties return several). */
export function matchMvps(m: Match): string[] {
  const counts = new Map<string, number>();
  for (const v of m.mvpVotes) counts.set(v.playerId, (counts.get(v.playerId) ?? 0) + 1);
  let best = 0;
  for (const c of counts.values()) best = Math.max(best, c);
  if (best === 0) return [];
  return [...counts.entries()].filter(([, c]) => c === best).map(([id]) => id);
}

export function playerStats(players: Player[], matches: Match[]): Map<string, PlayerStats> {
  const map = new Map<string, PlayerStats>();
  for (const p of players) {
    map.set(p.id, {
      playerId: p.id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      mvps: 0,
      points: 0,
    });
  }
  for (const m of matches) {
    if (!isPlayed(m)) continue;
    const winner = matchWinner(m);
    const apply = (ids: string[], team: TeamId) => {
      for (const id of ids) {
        const s = map.get(id);
        if (!s) continue;
        s.played++;
        if (winner === "draw") {
          s.draws++;
          s.points += 1;
        } else if (winner === team) {
          s.wins++;
          s.points += 3;
        } else s.losses++;
      }
    };
    apply(m.blacks, "blacks");
    apply(m.blancos, "blancos");
    for (const st of m.stats) {
      const s = map.get(st.playerId);
      if (!s) continue;
      s.goals += st.goals;
      s.assists += st.assists;
    }
    for (const id of matchMvps(m)) {
      const s = map.get(id);
      if (s) s.mvps++;
    }
  }
  return map;
}

export interface TeamRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function teamRecords(matches: Match[]): Record<TeamId, TeamRecord> {
  const mk = (): TeamRecord => ({ played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
  const out = { blacks: mk(), blancos: mk() };
  for (const m of matches) {
    if (!isPlayed(m)) continue;
    const b = m.blacksScore as number;
    const w = m.blancosScore as number;
    out.blacks.played++;
    out.blancos.played++;
    out.blacks.goalsFor += b;
    out.blacks.goalsAgainst += w;
    out.blancos.goalsFor += w;
    out.blancos.goalsAgainst += b;
    if (b > w) {
      out.blacks.wins++;
      out.blancos.losses++;
    } else if (b < w) {
      out.blancos.wins++;
      out.blacks.losses++;
    } else {
      out.blacks.draws++;
      out.blancos.draws++;
    }
  }
  return out;
}
