import React, { useEffect, useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

/**
 * Sticky banner that pops up when a new service worker version is waiting to activate.
 * Gives the user a prominent "Actualizar" button instead of the dismissible toast.
 *
 * Strategy:
 *  - Listen for the 'controllerchange' event (fires after skipWaiting + claim)
 *  - Listen for 'updatefound' + statechange => 'installed' on the registration
 *  - Poll registration.update() every 60s while the app is open
 */
export default function UpdatePrompt() {
  const [newWorker, setNewWorker] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let reg;
    let interval;

    const attach = async () => {
      try {
        reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        // Already waiting?
        if (reg.waiting && navigator.serviceWorker.controller) setNewWorker(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              setNewWorker(nw);
            }
          });
        });

        // Periodic update check (every 60s)
        interval = setInterval(() => { reg.update().catch(() => {}); }, 60_000);
        // Also check when tab becomes visible again
        document.addEventListener('visibilitychange', onVisibility);
      } catch (_) { /* no-op */ }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && reg) reg.update().catch(() => {});
    };

    // When the new SW takes control, reload to get fresh assets
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    attach();
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!newWorker || dismissed) return null;

  const applyUpdate = () => {
    try { newWorker.postMessage({ type: 'SKIP_WAITING' }); } catch (_) {}
    // controllerchange will trigger reload; fallback after 2s
    setTimeout(() => window.location.reload(), 2000);
  };

  return (
    <div
      className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-4 sm:left-auto sm:max-w-sm z-[70]"
      data-testid="update-prompt"
    >
      <div className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-4 pr-10">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base">Nueva versión disponible</p>
              <p className="text-xs sm:text-sm opacity-85 mt-0.5">
                Actualiza para ver las últimas mejoras y correcciones.
              </p>
              <button
                type="button"
                onClick={applyUpdate}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-primary text-sm font-bold hover:bg-white/90 transition-colors"
                data-testid="apply-update-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar ahora
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
          aria-label="Cerrar"
          data-testid="dismiss-update-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
