import React, { useEffect, useState } from 'react';
import { LogOut, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const BANNER_HEIGHT = 36;

export default function ImpersonationBanner() {
  const [adminToken, setAdminToken] = useState(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('kuxtal_admin_token');
    setAdminToken(t);
  }, []);

  // Apply layout offset for the navbar / page so the banner is always visible.
  useEffect(() => {
    if (!adminToken) return undefined;
    document.documentElement.classList.add('impersonating');
    return () => document.documentElement.classList.remove('impersonating');
  }, [adminToken]);

  if (!adminToken) return null;

  const exitImpersonation = async () => {
    setExiting(true);
    const returnPath = localStorage.getItem('kuxtal_admin_return') || '/admin';
    try {
      await api.post('/auth/restore-admin', { admin_token: adminToken });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Token admin expirado. Vuelve a iniciar sesión.');
      localStorage.removeItem('kuxtal_token');
      localStorage.removeItem('kuxtal_admin_token');
      localStorage.removeItem('kuxtal_admin_return');
      window.location.href = '/login';
      return;
    }
    localStorage.setItem('kuxtal_token', adminToken);
    localStorage.removeItem('kuxtal_admin_token');
    localStorage.removeItem('kuxtal_admin_return');
    toast.success('Volviendo al panel admin');
    window.location.href = returnPath;
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-sm shadow-md"
      style={{ height: BANNER_HEIGHT }}
      data-testid="impersonation-banner"
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate font-medium text-xs sm:text-sm">
            Sesión como usuario (modo administrador). Lo que hagas aquí afecta la cuenta real.
          </span>
        </div>
        <button
          onClick={exitImpersonation}
          disabled={exiting}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold whitespace-nowrap disabled:opacity-60"
          data-testid="exit-impersonation-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          {exiting ? 'Saliendo…' : 'Volver al admin'}
        </button>
      </div>
    </div>
  );
}
