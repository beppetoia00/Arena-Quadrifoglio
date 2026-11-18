import { Position, TeamId } from "./types";

const TEAM_WORDS: Record<string, TeamId> = { blacks: "blacks", black: "blacks", blancos: "blancos", blanco: "blancos" };
const POS_WORDS: Record<string, Position> = {
  por: "POR", portiere: "POR", gk: "POR",
  dif: "DIF", difensore: "DIF", difesa: "DIF",
  cen: "CEN", centrocampista: "CEN", centrocampo: "CEN", cc: "CEN",
  att: "ATT", attaccante: "ATT", attacco: "ATT", punta: "ATT",
};
const CAPTAIN_WORDS = new Set(["capitano", "cap", "c", "captain"]);

export function parseBulkLine(line: string): { name: string; team: TeamId | null; position: Position; isCaptain: boolean } | null {
  const tokens = line.replace(/[,;|]/g, " ").split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  let team: TeamId | null = null;
  let position: Position = "CEN";
  let isCaptain = false;
  const nameParts: string[] = [];
  for (const t of tokens) {
    const k = t.toLowerCase();
    if (TEAM_WORDS[k]) team = TEAM_WORDS[k];
    else if (POS_WORDS[k]) position = POS_WORDS[k];
    else if (CAPTAIN_WORDS.has(k)) isCaptain = true;
    else nameParts.push(t);
  }
  if (!nameParts.length) return null;
  return { name: nameParts.join(" "), team, position, isCaptain };
}

