import Link from "next/link";
import Image from "next/image";
import { FutCard } from "@/components/FutCard";
import { Crest } from "@/components/Crest";
import { loadArena, publicPlayer } from "@/lib/view";
import { formatValue, avgOverall } from "@/lib/rating";
import { isPlayed, teamRecords, matchMvps } from "@/lib/stats";
import { TEAM_LABEL } from "@/lib/types";

export default async function Home() {
  const { db, me, rated, ratedById, stats } = await loadArena();
  const top = rated.filter((r) => r.overall != null).slice(0, 5);
  const records = teamRecords(db.matches);
  const lastMatch = db.matches.find(isPlayed);
  const myVotes = me ? db.votes.filter((v) => v.voterId === me.id).length : 0;
  const toVote = me ? db.players.filter((p) => p.id !== me.id).length - myVotes : 0;
  const totalValue = rated.reduce((a, r) => a + r.value, 0);
  const blacksAvg = avgOverall(db.players.filter((p) => p.team === "blacks").map((p) => ratedById.get(p.id)));
  const blancosAvg = avgOverall(db.players.filter((p) => p.team === "blancos").map((p) => ratedById.get(p.id)));
  const topScorer = [...stats.values()].sort((a, b) => b.goals - a.goals)[0];
  const mvpKing = [...stats.values()].sort((a, b) => b.mvps - a.mvps)[0];

  return (
    <div className="space-y-10">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface/50 px-6 py-10 text-center md:py-14">
        <div className="rays absolute left-1/2 top-1/2 -z-0 h-[1400px] w-[1400px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]" />
        <div className="relative">
          <Image src="/brand/clover.png" alt="" width={96} height={96} className="mx-auto h-20 w-20 object-contain drop-shadow-[0_0_30px_rgba(0,153,146,0.7)] animate-float" priority />
          <h1 className="mt-4 font-display text-4xl font-bold uppercase tracking-[0.12em] text-white md:text-6xl">
            Arena <span className="text-teal-light">Quadrifoglio</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            L&apos;Ultimate Team dei tuoi amici. Sbusta i pacchetti, vota gli overall, crea le formazioni e scopri chi è l&apos;MVP.
            <span className="block font-display text-sm uppercase tracking-[0.3em] text-gold">{db.settings.seasonName}</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {me ? (
              <Link href="/vota" className="btn-gold !px-6 !py-3 !text-lg">
                {toVote > 0 ? `Sbusta ${toVote} ${toVote === 1 ? "pacchetto" : "pacchetti"}` : "Vai ai voti"}
              </Link>
            ) : (
              <Link href="/login" className="btn-gold !px-6 !py-3 !text-lg">
                Entra e sbusta
              </Link>
            )}
            <Link href="/giocatori" className="btn-ghost !px-6 !py-3 !text-lg">
              Tutte le carte
            </Link>
          </div>
        </div>
      </section>

      {/* teams */}
      <section className="grid gap-4 md:grid-cols-2">
        {(["blacks", "blancos"] as const).map((team) => {
          const r = records[team];
          const avg = team === "blacks" ? blacksAvg : blancosAvg;
          return (
            <Link
              key={team}
              href={`/squadre#${team}`}
              className={`card-panel flex items-center gap-4 transition hover:border-teal/50 ${team === "blacks" ? "bg-gradient-to-br from-black/60 to-surface" : "bg-gradient-to-br from-white/10 to-surface"}`}
            >
              <Crest team={team} size={84} />
              <div className="flex-1">
                <div className="font-display text-3xl uppercase tracking-wider">{TEAM_LABEL[team]}</div>
                <div className="text-sm text-muted">
                  {r.played} partite · {r.wins}V {r.draws}P {r.losses}S · gol {r.goalsFor}:{r.goalsAgainst}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted">Overall medio</div>
                <div className="font-display text-4xl text-gold">{avg ?? "–"}</div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* top cards */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl uppercase tracking-wider">Top carte</h2>
          <Link href="/giocatori" className="text-sm text-teal-light">
            Vedi tutte →
          </Link>
        </div>
        {top.length ? (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
            {top.map((r, i) => (
              <Link key={r.player.id} href={`/giocatori/${r.player.id}`} className="shrink-0">
                <div className="relative">
                  <FutCard player={publicPlayer(r.player)} overall={r.overall} attrs={r.attrs} tier={r.tier} width={190} glow={i === 0} />
                  <div className="absolute -left-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal font-display text-sm font-bold text-white shadow-lg">#{i + 1}</div>
                </div>
                <div className="mt-1 text-center text-xs text-muted">{formatValue(r.value)} crediti</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card-panel text-muted">
            Nessuna carta ancora.{" "}
            {db.players.length === 0 ? (
              <>
                L&apos;admin deve aggiungere i giocatori da{" "}
                <Link href="/admin" className="text-teal-light">
                  /admin
                </Link>
                .
              </>
            ) : (
              "Iniziate a votare per far apparire gli overall!"
            )}
          </div>
        )}
      </section>

      {/* numbers */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Giocatori" value={String(db.players.length)} />
        <Stat label="Voti dati" value={String(db.votes.length)} />
        <Stat label="Valore rosa" value={formatValue(totalValue)} />
        <Stat label="Partite giocate" value={String(db.matches.filter(isPlayed).length)} />
      </section>

      {/* last match + kings */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card-panel md:col-span-2">
          <div className="mb-2 font-display text-sm uppercase tracking-[0.3em] text-muted">Ultima partita</div>
          {lastMatch ? (
            <Link href={`/partite/${lastMatch.id}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crest team="blacks" size={56} />
                <span className="font-display text-2xl uppercase">Blacks</span>
              </div>
              <div className="font-display text-5xl font-bold">
                {lastMatch.blacksScore} <span className="text-muted">:</span> {lastMatch.blancosScore}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl uppercase">Blancos</span>
                <Crest team="blancos" size={56} />
              </div>
            </Link>
          ) : (
            <div className="text-muted">Nessuna partita giocata ancora.</div>
          )}
          {lastMatch && matchMvps(lastMatch).length > 0 && (
            <div className="mt-3 text-sm text-muted">
              MVP: <span className="text-gold">{matchMvps(lastMatch).map((id) => db.players.find((p) => p.id === id)?.name).join(", ")}</span>
            </div>
          )}
        </div>
        <div className="card-panel space-y-3">
          <King label="Capocannoniere" name={topScorer && topScorer.goals > 0 ? db.players.find((p) => p.id === topScorer.playerId)?.name : undefined} value={topScorer?.goals ? `${topScorer.goals} gol` : undefined} />
          <King label="Re degli MVP" name={mvpKing && mvpKing.mvps > 0 ? db.players.find((p) => p.id === mvpKing.playerId)?.name : undefined} value={mvpKing?.mvps ? `${mvpKing.mvps} MVP` : undefined} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-panel text-center">
      <div className="font-display text-3xl text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted">{label}</div>
    </div>
  );
}

function King({ label, name, value }: { label: string; name?: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted">{label}</div>
      <div className="font-display text-xl">{name ?? <span className="text-muted">—</span>}</div>
      {value && <div className="text-xs text-gold">{value}</div>}
    </div>
  );
}
