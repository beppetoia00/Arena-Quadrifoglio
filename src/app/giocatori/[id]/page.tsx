import Link from "next/link";
import { notFound } from "next/navigation";
import { FutCard } from "@/components/FutCard";
import { Crest } from "@/components/Crest";
import { loadArena, publicPlayer } from "@/lib/view";
import { ATTR_KEYS, ATTR_LABEL, formatValue, TIER_LABEL } from "@/lib/rating";
import { isPlayed, matchMvps, matchWinner } from "@/lib/stats";
import { POSITION_LABEL, TEAM_LABEL, TeamId } from "@/lib/types";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, me, rated, ratedById, stats } = await loadArena();
  const r = ratedById.get(id);
  if (!r) notFound();
  const p = r.player;
  const s = stats.get(id)!;
  const rank = rated.findIndex((x) => x.player.id === id) + 1;
  const myVote = me ? db.votes.find((v) => v.voterId === me.id && v.playerId === id) : undefined;
  const votes = db.votes.filter((v) => v.playerId === id && v.voterId !== id);
  const dist = [40, 50, 60, 70, 80, 90].map((lo) => ({ lo, n: votes.filter((v) => v.overall >= lo && v.overall < lo + 10).length }));
  const maxDist = Math.max(1, ...dist.map((d) => d.n));
  const history = db.matches
    .filter((m) => isPlayed(m) && (m.blacks.includes(id) || m.blancos.includes(id)))
    .map((m) => {
      const team: TeamId = m.blacks.includes(id) ? "blacks" : "blancos";
      const winner = matchWinner(m);
      const res = winner === "draw" ? "P" : winner === team ? "V" : "S";
      const st = m.stats.find((x) => x.playerId === id);
      return { m, team, res, goals: st?.goals ?? 0, assists: st?.assists ?? 0, mvp: matchMvps(m).includes(id) };
    });

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="flex flex-col items-center">
          <FutCard player={publicPlayer(p)} overall={r.overall} attrs={r.attrs} tier={r.tier} width={300} glow />
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full border border-line bg-surface px-3 py-1 font-display uppercase tracking-widest text-muted">{TIER_LABEL[r.tier]}</span>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-display uppercase tracking-widest text-gold">{formatValue(r.value)} crediti</span>
            {rank > 0 && r.overall != null && <span className="rounded-full border border-line bg-surface px-3 py-1 font-display uppercase tracking-widest text-muted">#{rank} in classifica</span>}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-wider">
              {p.name} {p.nickname && <span className="text-muted">“{p.nickname}”</span>}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-muted">
              <Crest team={p.team} size={22} />
              {p.team ? TEAM_LABEL[p.team] : "Senza squadra"} · {POSITION_LABEL[p.position]} {p.number ? `· #${p.number}` : ""}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Stat label="Partite" value={s.played} />
            <Stat label="Vittorie" value={s.wins} color="text-teal-light" />
            <Stat label="Pareggi" value={s.draws} />
            <Stat label="Sconfitte" value={s.losses} color="text-red-300" />
            <Stat label="Gol" value={s.goals} color="text-gold" />
            <Stat label="Assist" value={s.assists} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="MVP" value={s.mvps} color="text-gold" />
            <Stat label="Punti" value={s.points} />
            <Stat label="% vittorie" value={s.played ? `${Math.round((s.wins / s.played) * 100)}%` : "–"} />
          </div>

          {r.attrs && (
            <div className="card-panel">
              <div className="mb-2 font-display text-sm uppercase tracking-[0.3em] text-muted">Attributi</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {ATTR_KEYS.map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">{ATTR_LABEL[k]}</span>
                      <span className="font-display">{r.attrs![k]}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal to-gold" style={{ width: `${r.attrs![k]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-panel">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-display text-sm uppercase tracking-[0.3em] text-muted">Voti ricevuti ({votes.length})</div>
              {me && me.id !== id && (
                <Link href="/vota" className="text-sm text-teal-light">
                  {myVote ? `Il tuo voto: ${myVote.overall} · cambia` : "Vota ora →"}
                </Link>
              )}
            </div>
            <div className="flex h-24 items-end gap-2">
              {dist.map((d) => (
                <div key={d.lo} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-teal/70" style={{ height: `${(d.n / maxDist) * 80}px` }} />
                  <div className="text-[10px] text-muted">{d.lo}+</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl uppercase tracking-wider">Storico partite</h2>
        {history.length ? (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Squadra</th>
                  <th className="px-3 py-2">Risultato</th>
                  <th className="px-3 py-2 text-center">Gol</th>
                  <th className="px-3 py-2 text-center">Assist</th>
                  <th className="px-3 py-2 text-center">MVP</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.m.id} className="border-t border-line/60 hover:bg-surface-2/60">
                    <td className="px-3 py-2">
                      <Link href={`/partite/${h.m.id}`} className="text-teal-light">
                        {h.m.date}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{TEAM_LABEL[h.team]}</td>
                    <td className="px-3 py-2">
                      <span className={`mr-2 inline-block w-5 rounded text-center font-display ${h.res === "V" ? "bg-teal/30 text-teal-light" : h.res === "S" ? "bg-red-500/20 text-red-300" : "bg-surface-2 text-muted"}`}>{h.res}</span>
                      {h.m.blacksScore} - {h.m.blancosScore}
                    </td>
                    <td className="px-3 py-2 text-center">{h.goals || ""}</td>
                    <td className="px-3 py-2 text-center">{h.assists || ""}</td>
                    <td className="px-3 py-2 text-center">{h.mvp ? "⭐" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-panel text-muted">Nessuna partita giocata ancora.</div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, color = "" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface/70 p-2 text-center">
      <div className={`font-display text-2xl ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
