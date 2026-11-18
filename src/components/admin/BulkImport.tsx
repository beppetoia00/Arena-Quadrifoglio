"use client";

import { useActionState } from "react";
import { bulkImportAction } from "@/lib/actions";

export function BulkImport() {
  const [state, action, pending] = useActionState(bulkImportAction, null);
  return (
    <form action={action} className="space-y-3">
      <p className="text-xs text-muted">
        Un giocatore per riga: <span className="text-ink">Nome squadra ruolo capitano</span>. Squadra: blacks/blancos. Ruolo: POR, DIF, CEN, ATT (se manca: CEN). Se il nome esiste già, vengono aggiornati ruolo/squadra/capitano. Il PIN viene generato automaticamente, foto e dettagli si aggiungono dopo con “Modifica”.
      </p>
      <textarea name="lines" rows={6} className="input font-mono text-sm" placeholder={"Peppe blacks ATT\nGabriele blacks capitano\nCarbocci blancos DIF"} required />
      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}
      {state && state.ok && <div className="rounded-lg bg-teal/15 px-3 py-2 text-sm text-teal-light">{state.message}</div>}
      <button className="btn-ghost w-full" disabled={pending}>
        {pending ? "Importo..." : "Importa giocatori"}
      </button>
    </form>
  );
}
