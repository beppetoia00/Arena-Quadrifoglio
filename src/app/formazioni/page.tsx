import Link from "next/link";
import { loadArena } from "@/lib/view";
import { isAdmin } from "@/lib/auth";
import { getFormation } from "@/lib/formations";
import { LineupCard } from "@/components/LineupCard";
import { LineupPlayer } from "@/components/Pitch";

export const metadata = { title: "Formazioni" };

export default async function FormazioniPage() {
  const { db, me, ratedById } = await loadArena();
  const admin = await isAdmin();
  const byId = new Map(db.players.map((p) => [p.id, p]));
  const toLP = (ids: (string | null)[]): (LineupPlayer | null)[] =>
    ids.map((id) => {
      const p = id ? byId.get(id) : undefined;
      return p ? { id: p.id, name: p.nickname || p.name, position: p.position, overall: ratedById.get(p.id)?.overall ?? null, team: p.team, photo: p.photo } : null;
    });
  const lineups = [...db.lineups].sort((a, b) => b.votes.length - a.votes.length || b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider">Formazioni</h1>
          <p className="text-muted">Proponi le squadre per la prossima partita e vota la più equilibrata.</p>
        </div>
        <Link href={me ? "/formazioni/nuova" : "/login"} className="btn-primary">
          + Proponi
        </Link>
      </div>

      {lineups.length === 0 && <div className="card-panel text-muted">Nessuna formazione proposta. Sii il primo!</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        {lineups.map((l, i) => (
          <LineupCard
            key={l.id}
            lineup={l}
            rank={i + 1}
            authorName={byId.get(l.authorId)?.name ?? "?"}
            formations={{ blacks: getFormation(l.formation.blacks), blancos: getFormation(l.formation.blancos) }}
            players={{ blacks: toLP(l.slots.blacks), blancos: toLP(l.slots.blancos) }}
            meId={me?.id ?? null}
            canDelete={admin || l.authorId === me?.id}
            admin={admin}
          />
        ))}
      </div>
    </div>
  );
}
