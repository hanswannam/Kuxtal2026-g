import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, RefreshCw } from 'lucide-react';

// Fecha límite: WebAPKs generados ANTES de esta fecha probablemente tienen targetSdkVersion
// obsoleto y Play Protect en Android 14/15 los bloquea. Cuando lancemos una versión crítica
// del manifest, solo actualizar esta constante.
const WEBAPK_STALE_BEFORE = '2026-02-01';
const STORAGE_KEY = 'kuxtal_pwa_reinstall_dismissed_v1';

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function PWAReinstallBanner() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Only show on Android PWA installs (WebAPK)
    if (!isAndroid() || !isStandalone()) return;

    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === WEBAPK_STALE_BEFORE) return; // user dismissed for this version

    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, WEBAPK_STALE_BEFORE);
    setShow(false);
  };

  return (
    <div
      className="fixed left-0 right-0 z-[60] px-3 pb-3"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}
      data-testid="pwa-reinstall-banner"
    >
      <div className="max-w-2xl mx-auto rounded-2xl bg-amber-50 border border-amber-300 shadow-xl overflow-hidden">
        <div className="p-3 sm:p-4 flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-amber-950 text-sm sm:text-base">
              ¿Te salió "App no segura" de Google Play Protect?
            </p>
            <p className="text-xs sm:text-sm text-amber-900/80 mt-0.5">
              Reinstala la app para obtener la versión nueva y compatible con Android.
            </p>

            {expanded ? (
              <div className="mt-3 rounded-xl bg-white/70 border border-amber-200 p-3 text-xs sm:text-sm text-amber-950 space-y-2">
                <p className="font-semibold">Pasos para reinstalar:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Mantén presionado el ícono de <strong>Kuxtal Travel</strong> y toca <strong>Desinstalar</strong>.</li>
                  <li>Abre <strong>Chrome</strong> y entra a <strong>kuxtaltravelgt.com</strong>.</li>
                  <li>Toca el menú (⋮) y elige <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla principal"</strong>.</li>
                </ol>
                <p className="text-[11px] text-amber-900/70 pt-1">
                  La nueva versión ya no mostrará el aviso de Google Play Protect.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 mt-2 text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
                data-testid="pwa-reinstall-how"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ver cómo reinstalar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-lg hover:bg-amber-100 flex items-center justify-center text-amber-800"
            aria-label="Cerrar"
            data-testid="pwa-reinstall-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
