"use client";

import { useState, useTransition } from "react";
import { resetVotesAction, seedDemoAction } from "@/lib/actions";

export function DangerZone({ hasPlayers, votes }: { hasPlayers: boolean; votes: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? (res.message ?? "Fatto") : (res.error ?? "Errore"));
    });

  return (
    <section className="card-panel border-red-500/30">
      <h2 className="mb-2 font-display text-xl uppercase tracking-wider text-red-300">Zona pericolosa</h2>
      <div className="flex flex-wrap gap-2">
        {!hasPlayers && (
          <button className="btn-ghost" disabled={pending} onClick={() => run(seedDemoAction)}>
            Carica dati demo (8 giocatori, PIN 1234)
          </button>
        )}
        <button
          className="btn-danger"
          disabled={pending || votes === 0}
          onClick={() => {
            if (confirm(`Azzerare tutti i ${votes} voti? Le carte torneranno senza overall.`)) run(resetVotesAction);
          }}
        >
          Azzera tutti i voti ({votes})
        </button>
      </div>
      {msg && <div className="mt-3 text-sm text-muted">{msg}</div>}
    </section>
  );
}
