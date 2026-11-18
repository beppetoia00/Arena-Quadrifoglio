import Link from "next/link";
import { Crest } from "@/components/Crest";
import { FutCard } from "@/components/FutCard";
import { loadArena, publicPlayer } from "@/lib/view";
import { avgOverall, formatValue } from "@/lib/rating";
import { teamRecords } from "@/lib/stats";
import { TEAM_LABEL, TeamId } from "@/lib/types";

export const metadata = { title: "Squadre" };

export default async function SquadrePage() {
  const { db, rated, ratedById } = await loadArena();
  const records = teamRecords(db.matches);
  const free = rated.filter((r) => !r.player.team);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl uppercase tracking-wider">Blacks vs Blancos</h1>
      {(["blacks", "blancos"] as TeamId[]).map((team) => {
        const list = rated.filter((r) => r.player.team === team);
        const avg = avgOverall(list.map((r) => ratedById.get(r.player.id)));
        const value = list.reduce((a, r) => a + r.value, 0);
        const rec = records[team];
        return (
          <section key={team} id={team} className={`rounded-3xl border border-line p-5 ${team === "blacks" ? "bg-gradient-to-br from-black/70 to-surface" : "bg-gradient-to-br from-white/10 to-surface"}`}>
            <div className="flex flex-wrap items-center gap-4">
              <Crest team={team} size={96} />
              <div className="flex-1">
                <div className="font-display text-4xl uppercase tracking-wider">{TEAM_LABEL[team]}</div>
                <div className="text-sm text-muted">
                  {list.length} giocatori · valore rosa {formatValue(value)}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <Mini label="OVR" value={avg ?? "–"} gold />
                <Mini label="V" value={rec.wins} />
                <Mini label="P" value={rec.draws} />
                <Mini label="S" value={rec.losses} />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {list.map((r) => (
                <Link key={r.player.id} href={`/giocatori/${r.player.id}`} className="flex justify-center rounded-xl p-1 transition hover:bg-surface-2">
                  <FutCard player={publicPlayer(r.player)} overall={r.overall} attrs={r.attrs} tier={r.tier} width={160} />
                </Link>
              ))}
              {!list.length && <div className="col-span-full text-sm text-muted">Nessun giocatore assegnato (l&apos;admin può farlo da /admin).</div>}
            </div>
          </section>
        );
      })}
      {free.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl uppercase tracking-wider text-muted">Svincolati</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {free.map((r) => (
              <Link key={r.player.id} href={`/giocatori/${r.player.id}`} className="flex justify-center">
                <FutCard player={publicPlayer(r.player)} overall={r.overall} attrs={r.attrs} tier={r.tier} width={160} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Mini({ label, value, gold }: { label: string; value: number | string; gold?: boolean }) {
  return (
    <div>
      <div className={`font-display text-2xl ${gold ? "text-gold" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
