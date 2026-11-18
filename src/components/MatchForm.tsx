"use client";

import { useActionState, useState } from "react";
import { saveMatchAction } from "@/lib/actions";
import { Match, TEAM_LABEL, TeamId } from "@/lib/types";
import { PublicPlayer } from "@/lib/view";
import { Crest } from "./Crest";

export function MatchForm({ players, match, lineup }: { players: (PublicPlayer & { overall: number | null })[]; match?: Match; lineup?: { blacks: string[]; blancos: string[] } }) {
  const [state, action, pending] = useActionState(saveMatchAction, null);
  const [played, setPlayed] = useState(match ? match.blacksScore != null : true);
  const initial = (team: TeamId) =>
    new Set(match ? match[team] : lineup ? lineup[team] : players.filter((p) => p.team === team).map((p) => p.id));
  const [blacks, setBlacks] = useState<Set<string>>(initial("blacks"));
  const [blancos, setBlancos] = useState<Set<string>>(initial("blancos"));

  const toggle = (team: TeamId, id: string) => {
    const [set, setSet, other, setOther] = team === "blacks" ? [blacks, setBlacks, blancos, setBlancos] : [blancos, setBlancos, blacks, setBlacks];
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      if (other.has(id)) {
        const o = new Set(other);
        o.delete(id);
        setOther(o);
      }
    }
    setSet(next);
  };

  const statFor = (pid: string, k: "goals" | "assists") => match?.stats.find((s) => s.playerId === pid)?.[k] ?? 0;

  return (
    <form action={action} className="space-y-6">
      {match && <input type="hidden" name="id" value={match.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Data</label>
          <input type="date" name="date" defaultValue={match?.date ?? new Date().toISOString().slice(0, 10)} className="input" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Titolo (opzionale)</label>
          <input name="title" defaultValue={match?.title ?? ""} className="input" placeholder="Es. Derby del venerdì" />
        </div>
      </div>

      <div className="card-panel">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="played" value="1" checked={played} onChange={(e) => setPlayed(e.target.checked)} className="h-4 w-4 accent-teal" />
          Partita giocata (inserisci il risultato)
        </label>
        {played && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Crest team="blacks" size={40} />
              <input type="number" name="blacksScore" min={0} defaultValue={match?.blacksScore ?? 0} className="input w-20 text-center font-display text-2xl" />
            </div>
            <span className="font-display text-3xl text-muted">:</span>
            <div className="flex flex-col items-center gap-1">
              <Crest team="blancos" size={40} />
              <input type="number" name="blancosScore" min={0} defaultValue={match?.blancosScore ?? 0} className="input w-20 text-center font-display text-2xl" />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(["blacks", "blancos"] as TeamId[]).map((team) => {
          const set = team === "blacks" ? blacks : blancos;
          return (
            <div key={team} className="card-panel">
              <div className="mb-2 flex items-center gap-2">
                <Crest team={team} size={26} />
                <span className="font-display text-lg uppercase">{TEAM_LABEL[team]}</span>
                <span className="text-xs text-muted">({set.size} convocati)</span>
              </div>
              <div className="space-y-1">
                {players.map((p) => {
                  const on = set.has(p.id);
                  return (
                    <div key={p.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${on ? "bg-teal/10" : ""}`}>
                      <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" name={team} value={p.id} checked={on} onChange={() => toggle(team, p.id)} className="h-4 w-4 accent-teal" />
                        <span className={on ? "" : "text-muted"}>{p.name}</span>
                        <Crest team={p.team} size={14} />
                        <span className="text-[11px] text-muted">{p.position}</span>
                      </label>
                      {on && played && (
                        <div className="flex items-center gap-1 text-xs">
                          <span title="Gol">⚽</span>
                          <input type="number" name={`goals_${p.id}`} min={0} defaultValue={statFor(p.id, "goals")} className="input !w-14 !px-1 !py-1 text-center" />
                          <span title="Assist">🅰</span>
                          <input type="number" name={`assists_${p.id}`} min={0} defaultValue={statFor(p.id, "assists")} className="input !w-14 !px-1 !py-1 text-center" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="label">Note</label>
        <textarea name="notes" defaultValue={match?.notes ?? ""} className="input" rows={2} placeholder="Cronaca, gol pazzeschi, polemiche arbitrali..." />
      </div>

      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}
      <button className="btn-primary w-full !py-3 !text-lg" disabled={pending}>
        {pending ? "Salvo..." : match ? "Salva modifiche" : "Salva partita"}
      </button>
    </form>
  );
}
