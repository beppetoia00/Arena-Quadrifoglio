import { notFound, redirect } from "next/navigation";
import { MatchForm } from "@/components/MatchForm";
import { isAdmin } from "@/lib/auth";
import { loadArena, publicPlayer } from "@/lib/view";

export default async function ModificaPartita({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const { db, ratedById } = await loadArena();
  const match = db.matches.find((m) => m.id === id);
  if (!match) notFound();
  const players = db.players.map((p) => ({ ...publicPlayer(p), overall: ratedById.get(p.id)?.overall ?? null })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl uppercase tracking-wider">Modifica partita</h1>
      <MatchForm players={players} match={match} />
    </div>
  );
}
