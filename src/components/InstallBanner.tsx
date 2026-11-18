"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "aq_install_dismissed";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (standalone) return;
      if (localStorage.getItem(KEY)) return;
      const ua = navigator.userAgent;
      const isIos = /iPhone|iPad|iPod/i.test(ua);
      const isMobile = isIos || /Android/i.test(ua);
      if (!isMobile) return;
      const onPrompt = (e: Event) => {
        e.preventDefault();
        setDeferred(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      const t = setTimeout(() => {
        setIos(isIos);
        setShow(true);
      }, 2500);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        clearTimeout(t);
      };
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      dismiss();
    }
  };

  return (
    <div className="fixed inset-x-3 z-50 md:hidden" style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}>
      <div className="glass flex items-center gap-3 rounded-2xl p-3 shadow-2xl">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-display uppercase tracking-wider">Installa l&apos;app</div>
          <div className="text-xs text-muted">
            {ios ? (
              <>
                Tocca <span className="text-ink">Condividi</span> e poi <span className="text-ink">Aggiungi alla schermata Home</span>.
              </>
            ) : deferred ? (
              "Aggiungila alla home per aprirla a schermo intero."
            ) : (
              "Dal menu del browser scegli “Aggiungi a schermata Home”."
            )}
          </div>
        </div>
        {deferred && !ios && (
          <button onClick={install} className="btn-primary !px-3 !py-1.5 !text-xs">
            Installa
          </button>
        )}
        <button onClick={dismiss} aria-label="Chiudi" className="px-1 text-muted">
          ✕
        </button>
      </div>
    </div>
  );
}
