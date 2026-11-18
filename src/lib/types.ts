export type TeamId = "blacks" | "blancos";
export type Position = "POR" | "DIF" | "CEN" | "ATT";
export type Tier = "gold-rare" | "gold" | "silver-rare";

export interface Attrs {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  position: Position;
  team: TeamId | null;
  number?: number;
  /** Blob pathname (or local path) of the photo */
  photo?: string;
  /** 4-digit login PIN (shown to the admin so they can share it) */
  pin: string;
  isAdmin?: boolean;
  isCaptain?: boolean;
  createdAt: string;
}

export interface Vote {
  voterId: string;
  playerId: string;
  overall: number;
  attrs?: Attrs;
  updatedAt: string;
}

export interface MatchPlayerStat {
  playerId: string;
  goals: number;
  assists: number;
}

export interface MvpVote {
  voterId: string;
  playerId: string;
}

export interface Match {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  title?: string;
  blacksScore: number | null;
  blancosScore: number | null;
  blacks: string[]; // player ids
  blancos: string[]; // player ids
  stats: MatchPlayerStat[];
  mvpVotes: MvpVote[];
  notes?: string;
  lineupId?: string;
  createdAt: string;
}

export interface Lineup {
  id: string;
  title: string;
  authorId: string;
  formation: { blacks: string; blancos: string };
  slots: { blacks: (string | null)[]; blancos: (string | null)[] };
  votes: string[]; // voter ids
  createdAt: string;
}

export interface Transfer {
  id: string;
  playerId: string;
  from: TeamId | null;
  to: TeamId | null;
  byId: string | null; // captain/admin player id (null = admin via PIN)
  fee: number; // card value at the time of the transfer
  overall: number | null;
  note?: string;
  createdAt: string;
}

export interface PushSub {
  playerId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

export interface Settings {
  goldRareMin: number;
  goldMin: number;
  votingOpen: boolean;
  seasonName: string;
}

export interface DB {
  v: number;
  players: Player[];
  votes: Vote[];
  matches: Match[];
  lineups: Lineup[];
  transfers: Transfer[];
  pushSubs: PushSub[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  goldRareMin: 80,
  goldMin: 70,
  votingOpen: true,
  seasonName: "Stagione 2026/27",
};

export function emptyDb(): DB {
  return {
    v: 1,
    players: [],
    votes: [],
    matches: [],
    lineups: [],
    transfers: [],
    pushSubs: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export const POSITIONS: Position[] = ["POR", "DIF", "CEN", "ATT"];
export const POSITION_LABEL: Record<Position, string> = {
  POR: "Portiere",
  DIF: "Difensore",
  CEN: "Centrocampista",
  ATT: "Attaccante",
};

export const TEAM_LABEL: Record<TeamId, string> = {
  blacks: "Blacks",
  blancos: "Blancos",
};
