"use client";

import { useActionState } from "react";
import { broadcastPushAction } from "@/lib/actions";

export function BroadcastForm() {
  const [state, action, pending] = useActionState(broadcastPushAction, null);
  return (
    <form action={action} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <input name="title" className="input" placeholder="Titolo (es. Partita rinviata)" maxLength={60} />
        <input name="body" className="input" placeholder="Messaggio a tutti gli iscritti" maxLength={200} required />
      </div>
      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}
      {state && state.ok && <div className="rounded-lg bg-teal/15 px-3 py-2 text-sm text-teal-light">{state.message}</div>}
      <button className="btn-ghost" disabled={pending}>
        {pending ? "Invio..." : "📣 Invia avviso a tutti"}
      </button>
    </form>
  );
}
