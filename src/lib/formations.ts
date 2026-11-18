export interface Slot {
  /** x percentage across the pitch width (0 = left, 100 = right) */
  x: number;
  /** y percentage from the own goal line (0 = own goal, 100 = opponent goal) */
  y: number;
  role: "POR" | "DIF" | "CEN" | "ATT";
}

export interface Formation {
  id: string;
  label: string;
  players: number;
  slots: Slot[];
}

const row = (y: number, n: number, role: Slot["role"]): Slot[] =>
  Array.from({ length: n }, (_, i) => ({ x: ((i + 1) * 100) / (n + 1), y, role }));

export const FORMATIONS: Formation[] = [
  { id: "5-1-2-1", label: "1-2-1 (calcio a 5)", players: 5, slots: [{ x: 50, y: 8, role: "POR" }, ...row(35, 2, "DIF"), ...row(60, 1, "CEN"), ...row(85, 1, "ATT")] },
  { id: "5-2-2", label: "2-2 (calcio a 5)", players: 5, slots: [{ x: 50, y: 8, role: "POR" }, ...row(38, 2, "DIF"), ...row(78, 2, "ATT")] },
  { id: "7-2-3-1", label: "2-3-1 (calcio a 7)", players: 7, slots: [{ x: 50, y: 8, role: "POR" }, ...row(32, 2, "DIF"), ...row(58, 3, "CEN"), ...row(85, 1, "ATT")] },
  { id: "7-3-2-1", label: "3-2-1 (calcio a 7)", players: 7, slots: [{ x: 50, y: 8, role: "POR" }, ...row(32, 3, "DIF"), ...row(58, 2, "CEN"), ...row(85, 1, "ATT")] },
  { id: "7-3-1-2", label: "3-1-2 (calcio a 7)", players: 7, slots: [{ x: 50, y: 8, role: "POR" }, ...row(32, 3, "DIF"), ...row(56, 1, "CEN"), ...row(82, 2, "ATT")] },
  { id: "8-3-3-1", label: "3-3-1 (calcio a 8)", players: 8, slots: [{ x: 50, y: 8, role: "POR" }, ...row(32, 3, "DIF"), ...row(58, 3, "CEN"), ...row(85, 1, "ATT")] },
  { id: "8-2-3-2", label: "2-3-2 (calcio a 8)", players: 8, slots: [{ x: 50, y: 8, role: "POR" }, ...row(30, 2, "DIF"), ...row(56, 3, "CEN"), ...row(82, 2, "ATT")] },
  { id: "11-4-3-3", label: "4-3-3 (calcio a 11)", players: 11, slots: [{ x: 50, y: 7, role: "POR" }, ...row(28, 4, "DIF"), ...row(55, 3, "CEN"), ...row(82, 3, "ATT")] },
  { id: "11-4-4-2", label: "4-4-2 (calcio a 11)", players: 11, slots: [{ x: 50, y: 7, role: "POR" }, ...row(28, 4, "DIF"), ...row(55, 4, "CEN"), ...row(82, 2, "ATT")] },
  { id: "11-3-5-2", label: "3-5-2 (calcio a 11)", players: 11, slots: [{ x: 50, y: 7, role: "POR" }, ...row(28, 3, "DIF"), ...row(55, 5, "CEN"), ...row(82, 2, "ATT")] },
];

export function getFormation(id: string): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[2];
}
