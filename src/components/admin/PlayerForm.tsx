"use client";

import { useActionState, useRef, useState } from "react";
import { ActionResult, savePlayerAction } from "@/lib/actions";
import { POSITION_LABEL, POSITIONS } from "@/lib/types";
import { photoUrl } from "@/lib/photo";

export interface AdminPlayer {
  id: string;
  name: string;
  nickname?: string;
  position: string;
  team: string | null;
  number?: number;
  photo?: string;
  pin: string;
  isAdmin: boolean;
}

/** Downscale the chosen image client-side so uploads stay small (max 900px). */
async function downscale(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const max = 900;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 900 * 1024) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const keepPng = file.type === "image/png" || file.type === "image/webp";
  const type = keepPng ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, type, 0.88));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, keepPng ? ".png" : ".jpg"), { type });
}

export function PlayerForm({ player, onDone }: { player?: AdminPlayer; onDone?: () => void }) {
  const [preview, setPreview] = useState<string | null>(player ? photoUrl(player) : null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const res = await savePlayerAction(prev, formData);
      if (res.ok) {
        if (!player) setPreview(null);
        onDone?.();
      }
      return res;
    },
    null,
  );

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const small = await downscale(f);
    const dt = new DataTransfer();
    dt.items.add(small);
    e.target.files = dt.files;
    setPreview(URL.createObjectURL(small));
  };

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {player && <input type="hidden" name="id" value={player.id} />}
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-dashed border-line bg-surface-2 text-xs text-muted">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : "Foto"}
        </button>
        <input ref={fileRef} type="file" name="photo" accept="image/*" className="hidden" onChange={onFile} />
        <div className="flex-1 space-y-2">
          <div>
            <label className="label">Nome *</label>
            <input name="name" defaultValue={player?.name} className="input" required placeholder="Es. Beppe" />
          </div>
          <div>
            <label className="label">Soprannome (sulla carta)</label>
            <input name="nickname" defaultValue={player?.nickname} className="input" placeholder="Es. Il Bomber" />
          </div>
        </div>
      </div>
      <p className="-mt-1 text-[11px] text-muted">Consiglio: foto con sfondo rimosso (PNG trasparente) per l&apos;effetto carta FC. Viene ridotta automaticamente.</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Ruolo</label>
          <select name="position" defaultValue={player?.position ?? "CEN"} className="input">
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p} · {POSITION_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Squadra</label>
          <select name="team" defaultValue={player?.team ?? ""} className="input">
            <option value="">—</option>
            <option value="blacks">Blacks</option>
            <option value="blancos">Blancos</option>
          </select>
        </div>
        <div>
          <label className="label">Numero</label>
          <input name="number" type="number" min={1} max={99} defaultValue={player?.number ?? ""} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">PIN (4 cifre)</label>
          <input name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} defaultValue={player?.pin ?? ""} className="input font-display tracking-[0.3em]" placeholder={player ? "" : "auto"} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="isAdmin" value="1" defaultChecked={player?.isAdmin} className="h-4 w-4 accent-teal" /> è admin
        </label>
      </div>
      {state && !state.ok && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</div>}
      {state && state.ok && <div className="rounded-lg bg-teal/15 px-3 py-2 text-sm text-teal-light">{state.message}</div>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Salvo..." : player ? "Salva" : "Aggiungi giocatore"}
      </button>
    </form>
  );
}
