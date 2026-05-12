import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Loader2, Check, X as XIcon, MessageCircle, Mail, Clock, AlertTriangle, Send, RefreshCw, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { QuotationCardPreview } from './admin/QuotationPreview';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API = process.env.REACT_APP_BACKEND_URL;

// Build a compact diff like "3d 4h", "8h 12m", "00:00"
function buildDiff(ms) {
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${mins}m`;
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function CountdownBadge({ validUntil }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const until = useMemo(() => {
    if (!validUntil) return null;
    const d = new Date(validUntil).getTime();
    return isNaN(d) ? null : d;
  }, [validUntil]);
  if (!until) return null;
  const diff = until - now;
  const expired = diff <= 0;
  const urgent = !expired && diff < 24 * 3600000;
  const warn = !expired && diff < 72 * 3600000;
  const label = expired ? 'Cotización vencida' : `Vence en ${buildDiff(diff)}`;
  const dateStr = new Date(until).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  const tone = expired
    ? 'bg-rose-50 border-rose-300 text-rose-800'
    : urgent
    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
    : warn
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${tone}`}
      data-testid="quot-countdown"
    >
      <div className="flex items-center gap-2 min-w-0">
        {expired ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <Clock className="w-5 h-5 shrink-0" />}
        <div className="min-w-0">
          <p className="font-semibold text-sm" data-testid="quot-countdown-label">{label}</p>
          <p className="text-[11px] opacity-80">Válida hasta el {dateStr}</p>
        </div>
      </div>
    </div>
  );
}

export default function PublicQuotationPage() {
  const { token } = useParams();
  const [quot, setQuot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [settings, setSettings] = useState({ payment_whatsapp: '', default_valid_days: 10 });
  useDocumentTitle('Tu Cotización - Kuxtal Travels');

  useEffect(() => {
    axios.get(`${API}/api/quotations/public/${token}`)
      .then(r => setQuot(r.data))
      .catch(() => setQuot(null))
      .finally(() => setLoading(false));
    axios.get(`${API}/api/config/quotation-settings`)
      .then(r => setSettings(r.data))
      .catch(() => {});
  }, [token]);

  const decide = async (decision) => {
    setDeciding(true);
    try {
      await axios.post(`${API}/api/quotations/public/${token}/decision`, { decision });
      setQuot(q => ({ ...q, status: decision }));
      toast.success(decision === 'approved' ? '¡Cotización aprobada!' : 'Cotización rechazada');
    } catch {
      toast.error('Error al procesar la decisión');
    }
    setDeciding(false);
  };

  const isExpired = useMemo(() => {
    if (!quot?.valid_until) return false;
    const t = new Date(quot.valid_until).getTime();
    return !isNaN(t) && t < Date.now();
  }, [quot]);

  const waDigits = (settings.payment_whatsapp || '').replace(/[^0-9]/g, '');

  const buildPayMessage = () => {
    const code = quot.quotation_number || quot.id?.slice(0, 8) || 'COT';
    const total = Number(quot.total || 0);
    const totalStr = total > 0 ? `Q. ${total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : '';
    const pkg = quot.package_title ? ` (${quot.package_title})` : '';
    return `Hola, quiero pagar mi cotización #${code}${pkg}${totalStr ? ` por un total de ${totalStr}` : ''}. Por favor envíenme los datos de pago. ¡Gracias!`;
  };

  const buildRenewMessage = () => {
    const code = quot.quotation_number || quot.id?.slice(0, 8) || 'COT';
    const pkg = quot.package_title ? ` (${quot.package_title})` : '';
    return `Hola, mi cotización #${code}${pkg} está vencida. ¿Pueden renovarla o actualizar los precios? ¡Gracias!`;
  };

  const openWhatsApp = (text) => {
    if (!waDigits) {
      toast.error('El equipo aún no ha configurado un número de WhatsApp para pagos. Usa el WhatsApp del pie de página.');
      return;
    }
    const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!quot) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Cotización no encontrada</h1>
          <p className="text-muted-foreground">El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const decided = quot.status === 'approved' || quot.status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background pt-24 pb-12 px-4" data-testid="public-quot-page">
      <div className="max-w-2xl mx-auto">
        {quot.valid_until && (
          <div className="mb-4">
            <CountdownBadge validUntil={quot.valid_until} />
          </div>
        )}

        <QuotationCardPreview quot={quot} />

        {/* Pay now / Renew CTA */}
        <div
          className={`mt-6 rounded-2xl p-5 border ${isExpired ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}
          data-testid="pay-now-panel"
        >
          <div className="flex items-start gap-3">
            <div className={`rounded-full w-10 h-10 flex items-center justify-center shrink-0 ${isExpired ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
              {isExpired ? <AlertTriangle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-base mb-1">
                {isExpired ? 'Esta cotización está vencida' : '¿Listo para reservar?'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {isExpired
                  ? 'Aún puedes solicitar el pago o pedir una renovación: nuestro equipo revisará disponibilidad y precios actualizados.'
                  : 'Inicia tu pago por WhatsApp y un asesor confirmará disponibilidad y datos bancarios.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => openWhatsApp(buildPayMessage())}
                  className={`rounded-full text-white ${isExpired ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  data-testid="pay-now-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Pagar ahora por WhatsApp
                </Button>
                {isExpired && (
                  <Button
                    onClick={() => openWhatsApp(buildRenewMessage())}
                    variant="outline"
                    className="rounded-full border-rose-300 text-rose-700 hover:bg-rose-100"
                    data-testid="renew-btn"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Solicitar renovación
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {!decided && (
          <div className="mt-6 bg-white rounded-2xl border border-border p-6 text-center" data-testid="decision-panel">
            <p className="text-sm font-semibold mb-3">¿Te gusta esta cotización?</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => decide('approved')}
                disabled={deciding}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="approve-btn"
              >
                <Check className="w-4 h-4 mr-2" /> Aceptar cotización
              </Button>
              <Button
                onClick={() => decide('rejected')}
                disabled={deciding}
                variant="outline"
                className="rounded-full"
                data-testid="reject-btn"
              >
                <XIcon className="w-4 h-4 mr-2" /> No me interesa
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Al aceptar, nuestro equipo te contactará para los siguientes pasos.
            </p>
          </div>
        )}

        {decided && (
          <div className={`mt-6 rounded-2xl p-6 text-center ${quot.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-secondary border border-border'}`}>
            <p className="font-semibold text-sm">
              {quot.status === 'approved'
                ? '✓ Has aceptado esta cotización. Nuestro equipo te contactará pronto.'
                : 'Cotización rechazada. Si cambias de opinión, contáctanos.'}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center" data-testid="pdf-download-row">
          <a
            href={`${process.env.REACT_APP_BACKEND_URL}/api/quotations/public/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 h-10 rounded-full text-sm font-semibold border hover:bg-muted transition-colors"
            style={{ borderColor: '#D4AF37', color: '#0D2B45' }}
            data-testid="public-pdf-btn"
          >
            <FileDown className="w-4 h-4" />
            Descargar cotización en PDF
          </a>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>¿Tienes preguntas? Contáctanos</p>
          <div className="flex justify-center gap-4 mt-2">
            {waDigits && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary inline-flex items-center gap-1"
                data-testid="footer-whatsapp"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            <a href="mailto:info@kuxtaltravels.com" className="hover:text-primary inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
