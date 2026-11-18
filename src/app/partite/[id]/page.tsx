import Link from "next/link";
import { notFound } from "next/navigation";
import { Crest } from "@/components/Crest";
import { MvpVoting } from "@/components/MvpVoting";
import { DeleteMatchButton } from "@/components/DeleteMatchButton";
import { loadArena, publicPlayer } from "@/lib/view";
import { isAdmin } from "@/lib/auth";
import { isPlayed, matchMvps } from "@/lib/stats";
import { avgOverall } from "@/lib/rating";
import { TEAM_LABEL, TeamId } from "@/lib/types";
import { photoUrl } from "@/lib/photo";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, me, ratedById } = await loadArena();
  const admin = await isAdmin();
  const m = db.matches.find((x) => x.id === id);
  if (!m) notFound();
  const played = isPlayed(m);
  const mvps = matchMvps(m);
  const byId = new Map(db.players.map((p) => [p.id, p]));
  const myMvp = me ? m.mvpVotes.find((v) => v.voterId === me.id)?.playerId : undefined;
  const counts = new Map<string, number>();
  for (const v of m.mvpVotes) counts.set(v.playerId, (counts.get(v.playerId) ?? 0) + 1);

  const roster = (team: TeamId) =>
    (team === "blacks" ? m.blacks : m.blancos)
      .map((pid) => byId.get(pid))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        ...publicPlayer(p),
        overall: ratedById.get(p.id)?.overall ?? null,
        goals: m.stats.find((s) => s.playerId === p.id)?.goals ?? 0,
        assists: m.stats.find((s) => s.playerId === p.id)?.assists ?? 0,
        mvpVotes: counts.get(p.id) ?? 0,
        isMvp: mvps.includes(p.id),
      }));

  const blacks = roster("blacks");
  const blancos = roster("blancos");
  const participants = [...blacks, ...blancos];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/partite" className="text-sm text-muted">
          ← Partite
        </Link>
        {admin && (
          <div className="flex gap-2">
            <Link href={`/partite/${m.id}/modifica`} className="btn-ghost !py-1.5 !text-sm">
              Modifica
            </Link>
            <DeleteMatchButton matchId={m.id} />
          </div>
        )}
      </div>

      <section className="card-panel text-center">
        <div className="text-sm text-muted">
          {m.date} {m.title && `· ${m.title}`}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 md:gap-10">
          <div className="flex flex-col items-center gap-1">
            <Crest team="blacks" size={80} />
            <span className="font-display text-xl uppercase">Blacks</span>
            <span className="text-xs text-muted">OVR {avgOverall(blacks.map((p) => ratedById.get(p.id))) ?? "–"}</span>
          </div>
          <div className="font-display text-6xl font-bold md:text-7xl">
            {played ? (
              <>
                {m.blacksScore} <span className="text-muted">:</span> {m.blancosScore}
              </>
            ) : (
              <span className="text-2xl uppercase tracking-widest text-muted">da giocare</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Crest team="blancos" size={80} />
            <span className="font-display text-xl uppercase">Blancos</span>
            <span className="text-xs text-muted">OVR {avgOverall(blancos.map((p) => ratedById.get(p.id))) ?? "–"}</span>
          </div>
        </div>
        {mvps.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 font-display uppercase tracking-widest text-gold">
            ⭐ MVP: {mvps.map((pid) => byId.get(pid)?.name).join(", ")}
          </div>
        )}
        {m.notes && <p className="mt-3 text-sm text-muted">{m.notes}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(["blacks", "blancos"] as TeamId[]).map((team) => {
          const list = team === "blacks" ? blacks : blancos;
          return (
            <div key={team} className="card-panel">
              <div className="mb-3 flex items-center gap-2">
                <Crest team={team} size={28} />
                <span className="font-display text-xl uppercase">{TEAM_LABEL[team]}</span>
              </div>
              <ul className="divide-y divide-line/60">
                {list.map((p) => {
                  const url = photoUrl(p);
                  return (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-surface-2">
                        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted">{p.name.slice(0, 1)}</div>}
                      </div>
                      <Link href={`/giocatori/${p.id}`} className="flex-1">
                        <div className="font-medium">
                          {p.name} {p.isMvp && "⭐"}
                        </div>
                        <div className="text-xs text-muted">
                          {p.position} · OVR {p.overall ?? "–"}
                        </div>
                      </Link>
                      <div className="text-right text-sm">
                        {p.goals > 0 && <span className="mr-2">⚽ {p.goals}</span>}
                        {p.assists > 0 && <span className="text-muted">🅰 {p.assists}</span>}
                      </div>
                    </li>
                  );
                })}
                {!list.length && <li className="py-2 text-sm text-muted">Nessun convocato</li>}
              </ul>
            </div>
          );
        })}
      </section>

      {played && (
        <section className="card-panel">
          <h2 className="font-display text-xl uppercase tracking-wider">Vota l&apos;MVP</h2>
          <p className="mb-3 text-sm text-muted">
            {m.mvpVotes.length} {m.mvpVotes.length === 1 ? "voto" : "voti"} · puoi cambiare idea finché vuoi · niente autovoto
          </p>
          {me ? (
            <MvpVoting matchId={m.id} meId={me.id} players={participants} myVote={myMvp} />
          ) : (
            <Link href="/login" className="btn-primary">
              Entra per votare
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
