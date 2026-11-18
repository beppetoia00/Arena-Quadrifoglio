import Link from "next/link";
import { loadArena, toVoteCard } from "@/lib/view";
import { VoteFlow, VoteCard } from "@/components/VoteFlow";

export const metadata = { title: "Vota" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function VotaPage() {
  const { db, me, rated } = await loadArena();
  if (!me) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="font-display text-3xl uppercase">Devi entrare per votare</h1>
        <p className="text-muted">Scegli il tuo giocatore e inserisci il PIN.</p>
        <Link href="/login" className="btn-primary">
          Entra
        </Link>
      </div>
    );
  }
  const myVotes = new Map(db.votes.filter((v) => v.voterId === me.id).map((v) => [v.playerId, v]));
  const queue: VoteCard[] = [];
  const voted: VoteCard[] = [];
  for (const r of rated) {
    if (r.player.id === me.id) continue;
    const card = toVoteCard(r);
    const mine = myVotes.get(r.player.id);
    if (mine) voted.push({ ...card, myVote: { overall: mine.overall, attrs: mine.attrs } });
    else queue.push(card);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider">Sbusta e vota</h1>
          <p className="text-muted">
            Ciao {me.name}! {queue.length ? `Hai ${queue.length} ${queue.length === 1 ? "pacchetto" : "pacchetti"} da aprire.` : "Hai votato tutti i tuoi amici."}
          </p>
        </div>
      </div>
      <VoteFlow queue={shuffle(queue)} voted={voted} settings={db.settings} />
    </div>
  );
}
