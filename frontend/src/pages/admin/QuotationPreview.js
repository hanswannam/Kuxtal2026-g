import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { X, MessageCircle, ClipboardCopy, ExternalLink, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function QuotationPreviewModal({ quot, onClose }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/cotizacion/${quot.public_token}`;

  const waMsg = buildWhatsAppMessage(quot, publicUrl);
  const waLink = `https://wa.me/${(quot.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`;

  const emailSubject = `Cotización Kuxtal Travels - ${quot.package_title || 'Tu viaje'}`;
  const emailBody = waMsg;
  const mailtoLink = `mailto:${quot.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="quot-preview-modal">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-heading text-lg font-semibold">Vista previa y compartir</h3>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <QuotationCardPreview quot={quot} />
        </div>

        <div className="border-t border-border p-4 bg-white shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Link público de la cotización (compártelo con tu cliente):</p>
          <div className="flex gap-2 mb-3">
            <code className="flex-1 text-xs bg-secondary/50 rounded-lg px-3 py-2 font-mono truncate select-all" data-testid="public-link">{publicUrl}</code>
            <Button size="sm" onClick={copyLink} variant="outline" className="rounded-xl" data-testid="copy-link-btn">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" onClick={() => window.open(publicUrl, '_blank')} variant="outline" className="rounded-xl" data-testid="open-link-btn">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => window.open(waLink, '_blank')}
              disabled={!quot.phone}
              className="rounded-full flex-1 bg-[#25D366] hover:bg-[#1fb558] text-white"
              data-testid="send-whatsapp-btn"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Enviar por WhatsApp
            </Button>
            <Button
              onClick={() => window.open(mailtoLink, '_blank')}
              disabled={!quot.email}
              variant="outline"
              className="rounded-full flex-1"
              data-testid="send-email-btn"
            >
              <Mail className="w-4 h-4 mr-2" /> Enviar por correo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildWhatsAppMessage(q, publicUrl) {
  const greeting = q.is_member
    ? `¡Hola ${q.name}! Como socio Kuxtal, aquí está tu cotización personalizada:`
    : `¡Hola ${q.name}! Gracias por tu interés en Kuxtal Travels. Aquí está tu cotización:`;
  const total = Number(q.total) || 0;
  return [
    greeting,
    '',
    `*${q.package_title || 'Paquete personalizado'}*`,
    q.package_country ? `📍 ${q.package_country}` : '',
    q.travel_date ? `📅 Fecha: ${q.travel_date}` : '',
    `👥 ${q.guests || 1} persona(s)`,
    total > 0 ? `💰 *Total: Q.${total.toLocaleString()}*` : '',
    '',
    `Ver la cotización completa: ${publicUrl}`,
    '',
    '¡Estamos para servirte!',
    '— Kuxtal Travels',
  ].filter(Boolean).join('\n');
}

export function QuotationCardPreview({ quot }) {
  const KUXTAL_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";
  const total = Number(quot.total) || 0;
  const baseUnit = quot.is_member && Number(quot.member_unit_price) > 0 ? Number(quot.member_unit_price) : Number(quot.unit_price) || 0;
  const extras = quot.extras || [];
  const discount = Number(quot.discount) || 0;
  const subtotal = baseUnit * (Number(quot.guests) || 1);
  const extrasTotal = extras.reduce((s, e) => s + (Number(e.price) || 0), 0);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-border max-w-xl mx-auto" data-testid="quot-preview-card">
      {/* Header con branding */}
      <div className="bg-primary text-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={KUXTAL_LOGO} alt="Kuxtal Travels" className="h-12 w-12 rounded-lg bg-white p-1 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/70 font-semibold">Kuxtal Travels</p>
              <h2 className="font-heading text-xl font-bold mt-0.5 leading-tight">Cotización de Viaje</h2>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/60 uppercase">N°</p>
            <p className="text-xs font-mono">{quot._id?.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="p-6 border-b border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Preparada para</p>
        <p className="font-semibold text-lg">{quot.name}</p>
        <p className="text-sm text-muted-foreground">{quot.email} · {quot.phone}</p>
        {quot.is_member && (
          <p className="text-xs text-primary font-semibold mt-2">★ Socio Kuxtal · Contrato {quot.contract_number}</p>
        )}
      </div>

      {/* Paquete */}
      {quot.package_title && (
        <div className="p-6 border-b border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Destino</p>
          <h3 className="font-heading text-xl font-bold text-primary">{quot.package_title}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {quot.package_country && <span>📍 {quot.package_country}</span>}
            {quot.package_duration_days > 0 && <span>⏱ {quot.package_duration_days} días</span>}
            {quot.travel_date && <span>📅 {new Date(quot.travel_date).toLocaleDateString('es')}</span>}
            <span>👥 {quot.guests || 1} persona(s)</span>
          </div>
        </div>
      )}

      {/* Desglose */}
      <div className="p-6 space-y-2 text-sm">
        {baseUnit > 0 && (
          <div className="flex justify-between">
            <span>Precio {quot.is_member ? 'socio' : ''} × {quot.guests || 1}</span>
            <span className="font-mono">Q.{subtotal.toLocaleString()}</span>
          </div>
        )}
        {extras.map((e, i) => (
          <div key={i} className="flex justify-between text-muted-foreground">
            <span>+ {e.name}</span>
            <span className="font-mono">Q.{(Number(e.price) || 0).toLocaleString()}</span>
          </div>
        ))}
        {extras.length > 0 && (
          <div className="flex justify-between pt-2 border-t border-dashed border-border">
            <span className="text-muted-foreground">Subtotal extras</span>
            <span className="font-mono">Q.{extrasTotal.toLocaleString()}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Descuento</span>
            <span className="font-mono">- Q.{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-3 border-t-2 border-primary">
          <span className="font-bold text-primary">TOTAL</span>
          <span className="font-bold text-2xl text-primary font-mono">Q.{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Notas */}
      {quot.customer_notes && (
        <div className="p-6 bg-accent/30 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Observaciones</p>
          <p className="text-sm whitespace-pre-wrap">{quot.customer_notes}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-6 py-4 bg-secondary/30 border-t border-border">
        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
          Los precios pueden variar según fechas, temporada y disponibilidad. Esta cotización es referencial y tiene validez sujeta a confirmación final.
        </p>
      </div>
    </div>
  );
}
