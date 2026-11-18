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
  const key = sorters[by] ? by : "overall";
  rows.sort(sorters[key]);
  const records = teamRecords(db.matches);

  const tabs = [
    ["overall", "Overall"],
    ["value", "Valore"],
    ["goals", "Gol"],
    ["assists", "Assist"],
    ["mvp", "MVP"],
    ["points", "Punti"],
  ];

  // the headline number for the mobile list, depending on the active sort
  const headline = (row: (typeof rows)[number]) => {
    switch (key) {
      case "value":
        return { v: formatValue(row.r.value), l: "crediti" };
      case "goals":
        return { v: String(row.s.goals), l: "gol" };
      case "assists":
        return { v: String(row.s.assists), l: "assist" };
      case "mvp":
        return { v: String(row.s.mvps), l: "MVP" };
      case "points":
        return { v: String(row.s.points), l: "punti" };
      default:
        return { v: row.r.overall != null ? String(row.r.overall) : "–", l: "OVR" };
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl uppercase tracking-wider">Classifica</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["blacks", "blancos"] as const).map((t) => (
          <div key={t} className="card-panel flex items-center gap-3">
            <Crest team={t} size={44} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl uppercase">{TEAM_LABEL[t]}</div>
              <div className="text-xs text-muted">
                {records[t].wins}V {records[t].draws}P {records[t].losses}S · gol {records[t].goalsFor}:{records[t].goalsAgainst}
              </div>
            </div>
            <div className="font-display text-2xl text-gold">{records[t].wins * 3 + records[t].draws} pt</div>
          </div>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
        {tabs.map(([k, label]) => (
          <Link key={k} href={`/classifica?by=${k}`} className={`shrink-0 rounded-full px-4 py-1.5 font-display text-sm uppercase tracking-wider ${key === k ? "bg-teal text-white" : "border border-line text-muted"}`}>
            {label}
          </Link>
        ))}
      </div>

      {/* mobile: app-style list */}
      <ul className="space-y-2 md:hidden">
        {rows.map(({ r, s }, i) => {
          const url = photoUrl(r.player);
          const h = headline({ r, s });
          return (
            <li key={r.player.id}>
              <Link href={`/giocatori/${r.player.id}`} className="card-panel flex items-center gap-3 !p-3 active:bg-surface-2">
                <div className={`w-6 text-center font-display text-lg ${i < 3 ? "text-gold" : "text-muted"}`}>{i + 1}</div>
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-2">
                  {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-display text-lg text-muted">{r.player.name.slice(0, 1)}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate font-medium">
                    {r.player.name} <Crest team={r.player.team} size={14} /> <span className="text-xs text-muted">{r.player.position}</span>
                  </div>
                  <div className="text-[11px] text-muted">
                    {s.played}PG · {s.wins}V {s.draws}P {s.losses}S · ⚽{s.goals} 🅰{s.assists}
                    {s.mvps ? ` · ⭐${s.mvps}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-display text-2xl leading-none ${key === "overall" && r.tier === "silver-rare" ? "text-silver" : "text-gold"}`}>{h.v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">{h.l}</div>
                </div>
              </Link>
            </li>
          );
        })}
        {!rows.length && <li className="card-panel text-center text-muted">Nessun giocatore.</li>}
      </ul>

      {/* desktop: full table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
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
