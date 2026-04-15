import React from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Send, Phone } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export function AdminQuotations({ quotations, quotationResponse, setQuotationResponse, respondQuotation }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="admin-quotations">
      <h2 className="font-heading text-lg font-semibold">Cotizaciones ({quotations.length})</h2>
      {quotations.map((q, i) => (
        <div key={q._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`admin-quotation-${i}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{q.name || `Socio: ${q.contract_number}`}</h3>
              <p className="text-xs text-muted-foreground">{q.email} &middot; {q.phone}</p>
            </div>
            <Badge variant={q.status === 'responded' ? 'default' : 'secondary'} className="rounded-full">
              {q.status === 'pending' ? 'Pendiente' : 'Respondida'}
            </Badge>
          </div>
          {q.message && <p className="text-sm text-muted-foreground mb-3">{q.message}</p>}
          <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString('es')}</p>
          {q.status === 'pending' && (
            <div className="mt-3 pt-3 border-t border-border">
              {quotationResponse.id === q._id ? (
                <div className="space-y-2">
                  <Textarea value={quotationResponse.response} onChange={e => setQuotationResponse({...quotationResponse, response: e.target.value})} placeholder="Escribir respuesta..." className="rounded-xl" data-testid={`quotation-response-${i}`} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={respondQuotation} className="rounded-full bg-primary" data-testid={`send-response-${i}`}><Send className="w-3 h-3 mr-1" /> Enviar</Button>
                    <Button size="sm" variant="outline" onClick={() => setQuotationResponse({ id: '', response: '' })} className="rounded-full">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setQuotationResponse({ id: q._id, response: '' })} className="rounded-full" data-testid={`respond-quotation-${i}`}>Responder</Button>
              )}
            </div>
          )}
          {q.status === 'responded' && (
            <div className="mt-3 pt-3 border-t border-border flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={async () => {
                try {
                  const { data } = await api.get(`/quotations/${q._id}/share`);
                  if (data.whatsapp_url) window.open(data.whatsapp_url, '_blank');
                  else toast.error('Configura WhatsApp en ajustes primero');
                } catch { toast.error('Error al compartir'); }
              }} data-testid={`share-wa-${i}`}>
                <Phone className="w-3 h-3 mr-1" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={async () => {
                try {
                  const { data } = await api.get(`/quotations/${q._id}/share`);
                  window.open(data.mailto_url, '_blank');
                } catch { toast.error('Error al compartir'); }
              }} data-testid={`share-email-${i}`}>
                <Send className="w-3 h-3 mr-1" /> Email
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
