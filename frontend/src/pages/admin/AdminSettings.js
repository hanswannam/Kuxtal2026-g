import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Phone, MessageSquare, CreditCard, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export function AdminSettings({
  whatsappPhone, setWhatsappPhone, saveWhatsApp,
  quotSettings, setQuotSettings, saveQuotSettings,
  stats,
}) {
  const [pricing, setPricing] = useState({ public_markup_percent: 30, member_markup_percent: 15 });
  const [savingPricing, setSavingPricing] = useState(false);
  const [recalcCount, setRecalcCount] = useState({ total: 0, with_agency_price: 0, without_agency_price: 0 });
  const [recalcing, setRecalcing] = useState(false);
  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

  useEffect(() => {
    api.get('/config/pricing-settings').then(r => setPricing(r.data)).catch(() => {});
    api.get('/admin/packages/recalculatable-count').then(r => setRecalcCount(r.data)).catch(() => {});
  }, []);

  const runRecalculate = async () => {
    setRecalcing(true);
    try {
      const r = await api.post('/admin/packages/recalculate-prices');
      toast.success(`Recalculados ${r.data.updated} paquetes`);
      setShowRecalcConfirm(false);
      api.get('/admin/packages/recalculatable-count').then(r => setRecalcCount(r.data)).catch(() => {});
    } catch (e) {
      toast.error(e.response?.data?.detail || 'No se pudo recalcular');
    }
    setRecalcing(false);
  };

  const savePricing = async () => {
    setSavingPricing(true);
    try {
      const r = await api.put('/config/pricing-settings', {
        public_markup_percent: parseFloat(pricing.public_markup_percent) || 0,
        member_markup_percent: parseFloat(pricing.member_markup_percent) || 0,
      });
      toast.success('Porcentajes actualizados');
      setPricing({
        public_markup_percent: r.data.public_markup_percent,
        member_markup_percent: r.data.member_markup_percent,
      });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'No se pudo guardar');
    }
    setSavingPricing(false);
  };

  return (
    <div className="max-w-md space-y-6 animate-fade-in" data-testid="admin-settings">
      <div className="bg-white rounded-2xl p-6 border border-border">
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> WhatsApp</h2>
        <p className="text-sm text-muted-foreground mb-4">Configura el número de WhatsApp para el widget de chat</p>
        <div className="flex gap-2">
          <Input value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} placeholder="+502 5555-1234" className="rounded-xl" data-testid="whatsapp-input" />
          <Button onClick={saveWhatsApp} className="rounded-xl bg-primary hover:bg-primary/90" data-testid="save-whatsapp-btn">Guardar</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border" data-testid="quot-settings-card">
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Cotizaciones</h2>
        <p className="text-sm text-muted-foreground mb-4">Número de WhatsApp al que se envían los pagos desde el link público, y días de validez por defecto.</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> WhatsApp para pagos</Label>
            <Input
              value={quotSettings?.payment_whatsapp || ''}
              onChange={e => setQuotSettings({ ...quotSettings, payment_whatsapp: e.target.value })}
              placeholder="+502 5555-1234 (solo números o con +)"
              className="rounded-xl mt-1"
              data-testid="payment-wa-input"
            />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Días de validez por defecto</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={quotSettings?.default_valid_days ?? 10}
              onChange={e => setQuotSettings({ ...quotSettings, default_valid_days: parseInt(e.target.value) || 10 })}
              className="rounded-xl mt-1"
              data-testid="default-valid-days-input"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Al crear una cotización nueva, la fecha de vencimiento se calcula sumando estos días. Puedes overridear por cotización en el editor.</p>
          </div>
          <Button onClick={saveQuotSettings} className="w-full rounded-xl bg-primary hover:bg-primary/90" data-testid="save-quot-settings-btn">
            Guardar configuración de cotizaciones
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border" data-testid="pricing-settings-card">
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Porcentajes de precio</h2>
        <p className="text-sm text-muted-foreground mb-4">Porcentajes aplicados al precio de agencia. Se usan como sugerencia automática al crear o editar paquetes.</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Markup precio público (%)</Label>
            <Input
              type="number"
              min="0"
              max="500"
              step="0.5"
              value={pricing.public_markup_percent ?? 30}
              onChange={e => setPricing({ ...pricing, public_markup_percent: e.target.value })}
              className="rounded-xl mt-1"
              data-testid="public-markup-input"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Ej. 30% → si agencia=Q.1,000 → público=Q.1,300</p>
          </div>
          <div>
            <Label className="text-xs">Markup precio socio (%)</Label>
            <Input
              type="number"
              min="0"
              max="500"
              step="0.5"
              value={pricing.member_markup_percent ?? 15}
              onChange={e => setPricing({ ...pricing, member_markup_percent: e.target.value })}
              className="rounded-xl mt-1"
              data-testid="member-markup-input"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Ej. 15% → agencia=Q.1,000 → socio=Q.1,150</p>
          </div>
          <Button onClick={savePricing} disabled={savingPricing} className="w-full rounded-xl bg-primary hover:bg-primary/90" data-testid="save-pricing-btn">
            {savingPricing ? 'Guardando...' : 'Guardar porcentajes'}
          </Button>

          <div className="pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground mb-2">
              {recalcCount.with_agency_price} paquete(s) tienen precio de agencia y pueden recalcularse.
              {recalcCount.without_agency_price > 0 && ` ${recalcCount.without_agency_price} sin precio de agencia serán ignorados.`}
            </p>
            <Button
              type="button"
              onClick={() => setShowRecalcConfirm(true)}
              disabled={recalcCount.with_agency_price === 0}
              variant="outline"
              className="w-full rounded-xl border-primary/40 text-primary hover:bg-primary/5"
              data-testid="open-recalc-btn"
            >
              Recalcular todos los paquetes con los markups actuales
            </Button>
          </div>
        </div>
      </div>

      {showRecalcConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="recalc-confirm-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-lg font-semibold mb-2">¿Recalcular precios?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Se actualizarán <strong>{recalcCount.with_agency_price} paquete(s)</strong> aplicando:
            </p>
            <ul className="text-sm space-y-1 bg-secondary/40 rounded-xl p-3 mb-4">
              <li>Precio público = agencia × (1 + <strong>{pricing.public_markup_percent}%</strong>)</li>
              <li>Precio socio = agencia × (1 + <strong>{pricing.member_markup_percent}%</strong>)</li>
            </ul>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2 mb-4">
              ⚠️ Los precios sin precio de agencia (costo) no serán modificados.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRecalcConfirm(false)} className="flex-1 rounded-xl" data-testid="recalc-cancel-btn">Cancelar</Button>
              <Button onClick={runRecalculate} disabled={recalcing} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white" data-testid="recalc-confirm-btn">
                {recalcing ? 'Recalculando...' : `Recalcular ${recalcCount.with_agency_price}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <a href="/chat" className="block">
        <div className="bg-white rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors">
          <h2 className="font-heading text-lg font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Centro de Mensajes</h2>
          <p className="text-sm text-muted-foreground">Ver y responder conversaciones con socios</p>
          {(stats.unread_chats || 0) > 0 && <Badge className="rounded-full bg-primary mt-2">{stats.unread_chats} sin leer</Badge>}
        </div>
      </a>
    </div>
  );
}
