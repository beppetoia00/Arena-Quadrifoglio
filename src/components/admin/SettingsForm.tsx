"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/lib/actions";
import { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label">Nome stagione</label>
        <input name="seasonName" defaultValue={settings.seasonName} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div>
          <label className="label">Oro rara da OVR</label>
          <input name="goldRareMin" type="number" min={41} max={99} defaultValue={settings.goldRareMin} className="input" />
        </div>
        <div>
          <label className="label">Oro da OVR</label>
          <input name="goldMin" type="number" min={40} max={98} defaultValue={settings.goldMin} className="input" />
        </div>
        <div>
          <label className="label">Argento rara da OVR</label>
          <input name="silverRareMin" type="number" min={40} max={97} defaultValue={settings.silverRareMin} className="input" />
        </div>
        <div>
          <label className="label">Argento da OVR</label>
          <input name="silverMin" type="number" min={40} max={96} defaultValue={settings.silverMin} className="input" />
        </div>
        <div>
          <label className="label">Bronzo rara da OVR</label>
          <input name="bronzeRareMin" type="number" min={40} max={95} defaultValue={settings.bronzeRareMin} className="input" />
        </div>
      </div>
      <p className="text-[11px] text-muted">Sotto la soglia Bronzo Rara la carta è Bronzo.</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="votingOpen" value="1" defaultChecked={settings.votingOpen} className="h-4 w-4 accent-teal" /> Votazioni aperte
      </label>
      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}
      {state && state.ok && <div className="rounded-lg bg-teal/15 px-3 py-2 text-sm text-teal-light">{state.message}</div>}
      <button className="btn-primary w-full" disabled={pending}>
        Salva impostazioni
      </button>
    </form>
  );
}
