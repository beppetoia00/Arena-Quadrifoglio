import { Player } from "./types";

export function photoUrl(player: Pick<Player, "photo">): string | null {
  if (!player.photo) return null;
  return `/api/photo/${player.photo}`;
}
