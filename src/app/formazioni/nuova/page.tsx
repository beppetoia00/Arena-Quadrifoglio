import { redirect } from "next/navigation";
import { LineupBuilder } from "@/components/LineupBuilder";
import { loadArena, publicPlayer } from "@/lib/view";

export const metadata = { title: "Nuova formazione" };

export default async function NuovaFormazione() {
  const { db, me, ratedById } = await loadArena();
  if (!me) redirect("/login");
  const players = db.players.map((p) => ({ ...publicPlayer(p), overall: ratedById.get(p.id)?.overall ?? null }));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl uppercase tracking-wider">Proponi una formazione</h1>
      <p className="text-muted">Tocca una posizione in campo per scegliere il giocatore. L&apos;equilibrio è calcolato sugli overall.</p>
      <LineupBuilder players={players} />
    </div>
  );
}
