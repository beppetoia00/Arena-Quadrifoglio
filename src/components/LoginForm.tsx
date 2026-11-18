"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions";
import { PublicPlayer } from "@/lib/view";
import { Crest } from "./Crest";
import { photoUrl } from "@/lib/photo";

export function LoginForm({ players }: { players: PublicPlayer[] }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const [selected, setSelected] = useState<string>("");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="playerId" value={selected} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {players.map((p) => {
          const url = photoUrl(p);
          const isSel = selected === p.id;
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition ${
                isSel ? "border-teal bg-teal/15 shadow-[0_0_20px_rgba(0,153,146,0.4)]" : "border-line bg-surface hover:border-muted"
              }`}
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-surface-2">
                {url ? (
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-xl text-muted">{p.name.slice(0, 1)}</div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <Crest team={p.team} size={20} />
                </div>
              </div>
              <div className="w-full truncate text-center text-xs">{p.nickname || p.name}</div>
            </button>
          );
        })}
      </div>

      <div>
        <label className="label" htmlFor="pin">
          PIN (4 cifre)
        </label>
        <input id="pin" name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} className="input text-center font-display text-2xl tracking-[0.5em]" placeholder="••••" required />
      </div>

      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}

      <button className="btn-primary w-full !py-3 !text-lg" disabled={!selected || pending}>
        {pending ? "Entro..." : "Entra nell'Arena"}
      </button>
    </form>
  );
}
