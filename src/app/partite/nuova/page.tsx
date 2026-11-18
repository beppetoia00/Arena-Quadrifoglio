import { redirect } from "next/navigation";
import { MatchForm } from "@/components/MatchForm";
import { isAdmin } from "@/lib/auth";
import { loadArena, publicPlayer } from "@/lib/view";

export const metadata = { title: "Nuova partita" };

export default async function NuovaPartita({ searchParams }: { searchParams: Promise<{ lineup?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { lineup: lineupId } = await searchParams;
  const { db, ratedById } = await loadArena();
  const lineup = lineupId ? db.lineups.find((l) => l.id === lineupId) : undefined;
  const players = db.players.map((p) => ({ ...publicPlayer(p), overall: ratedById.get(p.id)?.overall ?? null })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl uppercase tracking-wider">Nuova partita</h1>
      <MatchForm
        players={players}
        lineup={
          lineup
            ? { blacks: lineup.slots.blacks.filter((x): x is string => Boolean(x)), blancos: lineup.slots.blancos.filter((x): x is string => Boolean(x)) }
            : undefined
        }
      />
    </div>
  );
}
