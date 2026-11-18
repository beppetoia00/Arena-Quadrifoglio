import Link from "next/link";
import { redirect } from "next/navigation";
import { FutCard } from "@/components/FutCard";
import { loadArena, publicPlayer } from "@/lib/view";
import { logoutAction } from "@/lib/actions";
import { formatValue, TIER_LABEL } from "@/lib/rating";

export const metadata = { title: "Profilo" };

export default async function ProfiloPage() {
  const { db, me, ratedById, stats } = await loadArena();
  if (!me) redirect("/login");
  const r = ratedById.get(me.id)!;
  const s = stats.get(me.id)!;
  const given = db.votes.filter((v) => v.voterId === me.id).length;
  const toGive = db.players.length - 1 - given;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <FutCard player={publicPlayer(me)} overall={r.overall} attrs={r.attrs} tier={r.tier} width={240} glow />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <h1 className="font-display text-3xl uppercase tracking-wider">Ciao {me.name}!</h1>
          <p className="text-muted">
            La tua carta è <span className="text-gold">{TIER_LABEL[r.tier]}</span> con overall <span className="font-display text-xl text-ink">{r.overall ?? "–"}</span> ({r.votesCount} voti) e vale{" "}
            <span className="text-gold">{formatValue(r.value)}</span> crediti.
          </p>
          <p className="text-sm text-muted">
            {s.played} partite · {s.wins}V {s.draws}P {s.losses}S · {s.goals} gol · {s.assists} assist · {s.mvps} MVP
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link href="/vota" className="btn-gold">
              {toGive > 0 ? `${toGive} pacchetti da aprire` : "I tuoi voti"}
            </Link>
            <Link href={`/giocatori/${me.id}`} className="btn-ghost">
              La mia pagina
            </Link>
            <form action={logoutAction}>
              <button className="btn-ghost">Esci</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
