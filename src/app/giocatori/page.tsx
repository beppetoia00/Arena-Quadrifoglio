import Link from "next/link";
import { FutCard } from "@/components/FutCard";
import { loadArena, publicPlayer } from "@/lib/view";
import { formatValue, TIER_LABEL, TIER_ORDER, tierMetal } from "@/lib/rating";
import { Tier } from "@/lib/types";

export const metadata = { title: "Carte" };

export default async function GiocatoriPage() {
  const { rated } = await loadArena();
  const groups: Record<Tier, typeof rated> = { "gold-rare": [], gold: [], "silver-rare": [], silver: [], "bronze-rare": [], bronze: [] };
  for (const r of rated) groups[r.tier].push(r);
  const unrated = rated.filter((r) => r.overall == null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wider">Tutte le carte</h1>
        <p className="text-muted">{rated.length} giocatori · ordinati per overall</p>
      </div>

      {TIER_ORDER.map((tier) => {
        const list = groups[tier].filter((r) => r.overall != null);
        if (!list.length) return null;
        return (
          <section key={tier}>
            <h2 className={`mb-3 font-display text-xl uppercase tracking-[0.2em] ${tierMetal(tier) === "silver" ? "text-silver" : tierMetal(tier) === "bronze" ? "text-[#d49a62]" : "text-gold"}`}>
              {TIER_LABEL[tier]} <span className="text-muted">({list.length})</span>
            </h2>
            <Grid list={list} />
          </section>
        );
      })}

      {unrated.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl uppercase tracking-[0.2em] text-muted">In attesa di voti ({unrated.length})</h2>
          <Grid list={unrated} />
        </section>
      )}

      {rated.length === 0 && <div className="card-panel text-muted">Nessun giocatore ancora.</div>}
    </div>
  );
}

function Grid({ list }: { list: Awaited<ReturnType<typeof loadArena>>["rated"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {list.map((r) => (
        <Link key={r.player.id} href={`/giocatori/${r.player.id}`} className="group flex flex-col items-center rounded-xl p-2 transition hover:bg-surface-2">
          <div className="transition group-hover:-translate-y-1">
            <FutCard player={publicPlayer(r.player)} overall={r.overall} attrs={r.attrs} tier={r.tier} width={170} />
          </div>
          <div className="mt-1 text-center text-xs text-muted">
            {r.overall != null ? `${formatValue(r.value)} · ${r.votesCount} voti` : "nessun voto"}
          </div>
        </Link>
      ))}
    </div>
  );
}
