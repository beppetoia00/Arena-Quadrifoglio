"use client";

import { useEffect, useState, useTransition } from "react";
import { subscribePushAction, testPushAction, unsubscribePushAction } from "@/lib/actions";

type State = "unsupported" | "denied" | "off" | "on" | "loading";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          if (!cancelled) setState("unsupported");
          return;
        }
        if (Notification.permission === "denied") {
          if (!cancelled) setState("denied");
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("unsupported");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const enable = () =>
    start(async () => {
      setMsg(null);
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setState("denied");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey as string) });
        const json = sub.toJSON();
        const res = await subscribePushAction({ endpoint: sub.endpoint, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } });
        if (!res.ok) {
          setMsg(res.error);
          return;
        }
        setState("on");
        const test = await testPushAction();
        setMsg(test.ok ? "Attive! Ti è arrivata una notifica di prova." : test.error);
      } catch (e) {
        setMsg("Impossibile attivare le notifiche: " + (e instanceof Error ? e.message : String(e)));
      }
    });

  const disable = () =>
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePushAction(sub.endpoint);
          await sub.unsubscribe();
        }
        setState("off");
        setMsg("Notifiche disattivate su questo dispositivo.");
      } catch {
        setMsg("Errore nel disattivare le notifiche");
      }
    });

  if (state === "loading") return null;

  if (state === "unsupported") {
    if (compact) return null;
    return (
      <div className="text-xs text-muted">
        Le notifiche non sono disponibili in questo browser. Su iPhone installa prima l&apos;app (Condividi → Aggiungi alla schermata Home) e aprila da lì.
      </div>
    );
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      {state === "on" ? (
        <button onClick={disable} disabled={pending} className="btn-ghost !py-1.5 !text-sm">
          🔔 Notifiche attive · disattiva
        </button>
      ) : state === "denied" ? (
        <div className="text-xs text-muted">Notifiche bloccate: riattivale dalle impostazioni del browser/telefono per questo sito.</div>
      ) : (
        <button onClick={enable} disabled={pending} className="btn-primary !py-1.5 !text-sm">
          🔔 {pending ? "..." : "Attiva notifiche partite e mercato"}
        </button>
      )}
      {msg && !compact && <div className="text-xs text-muted">{msg}</div>}
    </div>
  );
}
