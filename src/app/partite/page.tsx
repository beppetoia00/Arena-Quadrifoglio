import Link from "next/link";
import { Crest } from "@/components/Crest";
import { loadArena } from "@/lib/view";
import { isAdmin } from "@/lib/auth";
import { isPlayed, matchMvps } from "@/lib/stats";

export const metadata = { title: "Partite" };

export default async function PartitePage() {
  const { db } = await loadArena();
  const admin = await isAdmin();
  const byId = new Map(db.players.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider">Partite</h1>
          <p className="text-muted">Risultati, marcatori e MVP di ogni sfida Blacks vs Blancos.</p>
        </div>
        {admin && (
          <Link href="/partite/nuova" className="btn-primary">
            + Nuova partita
          </Link>
        )}
      </div>

      {db.matches.length === 0 && (
        <div className="card-panel text-muted">Nessuna partita ancora. {admin ? "Creane una!" : "L'admin può registrare le partite."}</div>
      )}

      <div className="space-y-3">
        {db.matches.map((m) => {
          const played = isPlayed(m);
          const mvps = matchMvps(m).map((id) => byId.get(id)?.name).filter(Boolean);
          return (
            <Link key={m.id} href={`/partite/${m.id}`} className="card-panel flex items-center gap-4 transition hover:border-teal/50">
              <div className="w-20 shrink-0 text-xs text-muted">
                <div className="font-display text-base text-ink">{m.date}</div>
                {m.title && <div className="truncate">{m.title}</div>}
              </div>
              <div className="flex flex-1 items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <Crest team="blacks" size={36} />
                  <span className="hidden font-display uppercase sm:inline">Blacks</span>
                </div>
                <div className="font-display text-3xl font-bold">
                  {played ? (
                    <>
                      {m.blacksScore} <span className="text-muted">:</span> {m.blancosScore}
                    </>
                  ) : (
                    <span className="text-base uppercase tracking-widest text-muted">da giocare</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden font-display uppercase sm:inline">Blancos</span>
                  <Crest team="blancos" size={36} />
                </div>
              </div>
              <div className="hidden w-32 shrink-0 text-right text-xs text-muted sm:block">
                {mvps.length ? (
                  <>
                    ⭐ <span className="text-gold">{mvps.join(", ")}</span>
                  </>
                ) : played ? (
                  `${m.mvpVotes.length} voti MVP`
                ) : (
                  ""
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
