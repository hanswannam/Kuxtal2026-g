import React, { useEffect, useState, useMemo } from 'react';
import { Download, Bell, X, Share as ShareIcon, Plus, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { enablePushNotifications } from '../contexts/AuthContext';

// Detects the platform so we show the right "install" instructions.
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || navigator.vendor || '';
  const isIpad = /iPad|Macintosh/.test(ua) && 'ontouchend' in document;
  if (/iPhone|iPod/.test(ua) || isIpad) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  );
}

const SEEN_KEY = 'kuxtal_install_prompt_seen_v1';
const PUSH_SEEN_KEY = 'kuxtal_push_prompt_seen_v1';

/**
 * Floating banner that:
 *  - Shows "Instalar app" prompt with native beforeinstallprompt on Android/Chrome/Edge
 *  - Shows iOS "Agregar a pantalla inicio" instructions (Safari only route)
 *  - Once installed (standalone), nudges to enable push notifications
 *  - Can be dismissed (remembered in localStorage)
 */
export default function InstallPrompt() {
  const platform = useMemo(detectPlatform, []);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    setInstalled(isStandalone());
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
    setPushSupported(supported);
    if (supported) setPushGranted(Notification.permission === 'granted');
  }, []);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      toast.success('¡App instalada! Ya puedes abrirla desde tu pantalla de inicio.');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // iOS: show banner manually after a short delay if not already installed
    if (platform === 'ios' && !isStandalone() && !dismissed) {
      const t = setTimeout(() => setVisible(true), 3500);
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [platform, dismissed]);

  // If already installed but push not yet granted, show a secondary banner (once)
  useEffect(() => {
    if (!installed || !pushSupported || pushGranted) return;
    try {
      if (localStorage.getItem(PUSH_SEEN_KEY) === '1') return;
    } catch (e) { void e; }
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [installed, pushSupported, pushGranted]);

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        toast.success('Instalando Kuxtal Travel...');
      }
      setDeferredPrompt(null);
    } catch (e) {
      console.error('install error', e);
    }
  };

  const enablePush = async () => {
    setEnabling(true);
    const res = await enablePushNotifications();
    setEnabling(false);
    if (res.ok) {
      setPushGranted(true);
      toast.success('Notificaciones activadas');
      try { localStorage.setItem(PUSH_SEEN_KEY, '1'); } catch (e) { void e; }
      setVisible(false);
    } else if (res.reason === 'denied') {
      toast.error('Activa las notificaciones desde los ajustes del navegador/app');
    } else if (res.reason === 'unsupported') {
      toast.error('Este dispositivo no soporta notificaciones push aún');
    } else {
      toast.error('No se pudo activar las notificaciones');
    }
  };

  const dismiss = (persistent = true) => {
    setVisible(false);
    setIosHelp(false);
    if (persistent) {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { void e; }
      setDismissed(true);
    }
  };

  // Nothing to show
  if (!visible) return null;

  // Installed + push not granted → offer push
  if (installed && pushSupported && !pushGranted) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 animate-fade-in" data-testid="push-optin-banner">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-4 flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm mb-0.5">Activa las notificaciones</p>
            <p className="text-xs text-muted-foreground mb-3">Recibe alertas de nuevas promociones, cotizaciones y paquetes al instante.</p>
            <div className="flex gap-2">
              <button onClick={enablePush} disabled={enabling} className="flex-1 rounded-full bg-primary text-white text-xs font-medium py-2 hover:bg-primary/90 transition" data-testid="enable-push-btn">
                {enabling ? 'Activando...' : 'Activar'}
              </button>
              <button onClick={() => dismiss(true)} className="rounded-full bg-secondary text-xs font-medium py-2 px-3 hover:bg-secondary/70" data-testid="dismiss-push-btn">
                Ahora no
              </button>
            </div>
          </div>
          <button onClick={() => dismiss(true)} className="text-muted-foreground hover:text-foreground" data-testid="close-push-banner"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  // iOS instructions modal (Safari only path, must be "Agregar a pantalla de inicio")
  if (iosHelp) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" data-testid="ios-install-help" onClick={() => setIosHelp(false)}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 m-0 sm:m-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-semibold">Instalar en iPhone / iPad</h3>
            </div>
            <button onClick={() => setIosHelp(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <ol className="text-sm space-y-3 text-foreground/90">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">1</span>
              <span>Abre esta página en <strong>Safari</strong> (no funciona en Chrome ni Gmail).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">2</span>
              <span className="flex items-center gap-1 flex-wrap">Toca el botón <ShareIcon className="w-4 h-4 inline" /> <strong>Compartir</strong> en la barra inferior.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">3</span>
              <span className="flex items-center gap-1 flex-wrap">Elige <Plus className="w-4 h-4 inline" /> <strong>Agregar a pantalla de inicio</strong> y confirma.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">4</span>
              <span>Abre Kuxtal desde el ícono en tu pantalla de inicio y activa las notificaciones cuando te las pida.</span>
            </li>
          </ol>
          <p className="text-[11px] text-muted-foreground mt-4">Las notificaciones push en iPhone requieren iOS 16.4 o superior, y que la app esté instalada en pantalla de inicio.</p>
          <button onClick={() => dismiss(true)} className="w-full mt-4 rounded-full bg-primary text-white font-medium py-2.5 text-sm">Entendido</button>
        </div>
      </div>
    );
  }

  // Install banner (desktop/android with beforeinstallprompt, or iOS educational)
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 animate-fade-in" data-testid="install-prompt">
      <div className="bg-primary text-white rounded-2xl shadow-xl p-4 flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm mb-0.5">Instala Kuxtal Travel</p>
          <p className="text-xs text-white/80 mb-3">
            {platform === 'ios'
              ? 'Agrégala a tu pantalla de inicio para recibir notificaciones y abrir la app más rápido.'
              : 'Una experiencia más rápida y recibe notificaciones de tus cotizaciones.'}
          </p>
          <div className="flex gap-2">
            {deferredPrompt ? (
              <button onClick={install} className="flex-1 rounded-full bg-white text-primary text-xs font-medium py-2 hover:bg-white/90 transition" data-testid="install-btn">
                Instalar ahora
              </button>
            ) : platform === 'ios' ? (
              <button onClick={() => setIosHelp(true)} className="flex-1 rounded-full bg-white text-primary text-xs font-medium py-2 hover:bg-white/90 transition" data-testid="ios-install-show-btn">
                Cómo instalar
              </button>
            ) : (
              <button onClick={() => { toast.info('Usa el menú del navegador → "Instalar aplicación"'); dismiss(true); }} className="flex-1 rounded-full bg-white text-primary text-xs font-medium py-2 hover:bg-white/90 transition">
                Cómo instalar
              </button>
            )}
            <button onClick={() => dismiss(true)} className="rounded-full bg-white/10 text-xs font-medium py-2 px-3 hover:bg-white/20" data-testid="dismiss-install-btn">
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={() => dismiss(true)} className="text-white/60 hover:text-white" data-testid="close-install-banner"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
