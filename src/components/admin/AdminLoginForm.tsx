"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/lib/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, null);
  return (
    <form action={action} className="card-panel space-y-4">
      <div>
        <label className="label" htmlFor="apin">
          PIN admin
        </label>
        <input id="apin" name="pin" type="password" inputMode="numeric" className="input text-center font-display text-2xl tracking-[0.4em]" placeholder="••••" required autoFocus />
      </div>
      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}
      <button className="btn-gold w-full" disabled={pending}>
        {pending ? "..." : "Entra come admin"}
      </button>
    </form>
  );
}
