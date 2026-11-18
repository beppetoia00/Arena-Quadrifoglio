"use client";

import { useState, useTransition } from "react";
import { deletePlayerAction } from "@/lib/actions";
import { photoUrl } from "@/lib/photo";
import { Crest } from "../Crest";
import { AdminPlayer, PlayerForm } from "./PlayerForm";

type Row = AdminPlayer & { overall: number | null; votes: number; team: "blacks" | "blancos" | null };

export function PlayersTable({ players }: { players: Row[] }) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={showPins} onChange={(e) => setShowPins(e.target.checked)} className="accent-teal" /> mostra i PIN
      </label>
      <div className="divide-y divide-line/60">
        {players.map((p) => {
          const url = photoUrl(p);
          return (
            <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-2">
                {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted">{p.name.slice(0, 1)}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-medium">
                  {p.name} {p.nickname && <span className="text-muted">“{p.nickname}”</span>} <Crest team={p.team} size={14} /> {p.isCaptain && <span className="rounded bg-teal/20 px-1 text-[10px] text-teal-light">C</span>} {p.isAdmin && <span className="rounded bg-gold/20 px-1 text-[10px] text-gold">admin</span>}
                </div>
                <div className="text-xs text-muted">
                  {p.position} · OVR {p.overall ?? "–"} · {p.votes} voti {showPins && <span className="ml-2 font-display text-ink">PIN {p.pin}</span>}
                </div>
              </div>
              <button className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setEditing(p)}>
                Modifica
              </button>
              <button
                className="btn-danger !px-2 !py-1 !text-xs"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Eliminare ${p.name} e tutti i suoi voti?`)) start(() => deletePlayerAction(p.id).then(() => undefined));
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
        {!players.length && <div className="py-3 text-sm text-muted">Nessun giocatore. Aggiungi i tuoi amici!</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setEditing(null)}>
          <div className="glass max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-lg uppercase">Modifica {editing.name}</div>
              <button onClick={() => setEditing(null)} className="text-muted">
                ✕
              </button>
            </div>
            <PlayerForm player={editing} onDone={() => setEditing(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
