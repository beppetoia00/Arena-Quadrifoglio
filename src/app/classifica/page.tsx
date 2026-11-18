import Link from "next/link";
import { Crest } from "@/components/Crest";
import { loadArena } from "@/lib/view";
import { formatValue } from "@/lib/rating";
import { photoUrl } from "@/lib/photo";
import { teamRecords } from "@/lib/stats";
import { TEAM_LABEL } from "@/lib/types";

export const metadata = { title: "Classifica" };

export default async function ClassificaPage({ searchParams }: { searchParams: Promise<{ by?: string }> }) {
  const { by = "overall" } = await searchParams;
  const { rated, stats, db } = await loadArena();
  const rows = rated.map((r) => ({ r, s: stats.get(r.player.id)! }));
  const sorters: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    overall: (a, b) => (b.r.overall ?? -1) - (a.r.overall ?? -1),
    value: (a, b) => b.r.value - a.r.value,
    goals: (a, b) => b.s.goals - a.s.goals || b.s.assists - a.s.assists,
    assists: (a, b) => b.s.assists - a.s.assists || b.s.goals - a.s.goals,
    mvp: (a, b) => b.s.mvps - a.s.mvps,
    points: (a, b) => b.s.points - a.s.points || b.s.wins - a.s.wins,
  };
  rows.sort(sorters[by] ?? sorters.overall);
  const records = teamRecords(db.matches);

  const tabs = [
    ["overall", "Overall"],
    ["value", "Valore"],
    ["goals", "Gol"],
    ["assists", "Assist"],
    ["mvp", "MVP"],
    ["points", "Punti"],
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl uppercase tracking-wider">Classifica</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["blacks", "blancos"] as const).map((t) => (
          <div key={t} className="card-panel flex items-center gap-3">
            <Crest team={t} size={48} />
            <div className="flex-1 font-display text-xl uppercase">{TEAM_LABEL[t]}</div>
            <div className="text-sm text-muted">
              {records[t].wins}V {records[t].draws}P {records[t].losses}S · {records[t].goalsFor}:{records[t].goalsAgainst}
            </div>
            <div className="font-display text-2xl text-gold">{records[t].wins * 3 + records[t].draws} pt</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {tabs.map(([k, label]) => (
          <Link key={k} href={`/classifica?by=${k}`} className={`shrink-0 rounded-full px-4 py-1.5 font-display text-sm uppercase tracking-wider ${by === k ? "bg-teal text-white" : "border border-line text-muted"}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-[10px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Giocatore</th>
              <th className="px-3 py-2 text-center">OVR</th>
              <th className="px-3 py-2 text-center">Valore</th>
              <th className="px-3 py-2 text-center">PG</th>
              <th className="px-3 py-2 text-center">V</th>
              <th className="px-3 py-2 text-center">P</th>
              <th className="px-3 py-2 text-center">S</th>
              <th className="px-3 py-2 text-center">Gol</th>
              <th className="px-3 py-2 text-center">Assist</th>
              <th className="px-3 py-2 text-center">MVP</th>
              <th className="px-3 py-2 text-center">Punti</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, s }, i) => {
              const url = photoUrl(r.player);
              return (
                <tr key={r.player.id} className="border-t border-line/60 hover:bg-surface-2/60">
                  <td className="px-3 py-2 font-display text-muted">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link href={`/giocatori/${r.player.id}`} className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-2">
                        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted">{r.player.name.slice(0, 1)}</div>}
                      </div>
                      <span className="font-medium">{r.player.name}</span>
                      <Crest team={r.player.team} size={16} />
                      <span className="text-xs text-muted">{r.player.position}</span>
                    </Link>
                  </td>
                  <td className={`px-3 py-2 text-center font-display text-lg ${r.tier === "silver-rare" ? "text-silver" : "text-gold"}`}>{r.overall ?? "–"}</td>
                  <td className="px-3 py-2 text-center">{formatValue(r.value)}</td>
                  <td className="px-3 py-2 text-center">{s.played}</td>
                  <td className="px-3 py-2 text-center text-teal-light">{s.wins}</td>
                  <td className="px-3 py-2 text-center">{s.draws}</td>
                  <td className="px-3 py-2 text-center text-red-300">{s.losses}</td>
                  <td className="px-3 py-2 text-center">{s.goals}</td>
                  <td className="px-3 py-2 text-center">{s.assists}</td>
                  <td className="px-3 py-2 text-center">{s.mvps ? `⭐ ${s.mvps}` : "–"}</td>
                  <td className="px-3 py-2 text-center font-display">{s.points}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-muted">
                  Nessun giocatore.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
