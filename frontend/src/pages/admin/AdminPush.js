import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Send } from 'lucide-react';

export function AdminPush({ pushForm, setPushForm, sendPush, pushHistory }) {
  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-push">
      <div className="max-w-md">
        <h2 className="font-heading text-lg font-semibold mb-4">Enviar Notificacion Push</h2>
        <form onSubmit={sendPush} className="bg-white rounded-2xl p-6 border border-border space-y-3">
          <div><Label className="text-xs">Titulo</Label><Input value={pushForm.title} onChange={e => setPushForm({...pushForm, title: e.target.value})} required placeholder="Kuxtal Travel" className="rounded-xl mt-1" data-testid="push-title" /></div>
          <div><Label className="text-xs">Mensaje</Label><Textarea value={pushForm.message} onChange={e => setPushForm({...pushForm, message: e.target.value})} required placeholder="Tu mensaje aqui..." className="rounded-xl mt-1" data-testid="push-message" /></div>
          <div><Label className="text-xs">Enlace</Label><Input value={pushForm.link} onChange={e => setPushForm({...pushForm, link: e.target.value})} placeholder="/" className="rounded-xl mt-1" data-testid="push-link" /></div>
          <div><Label className="text-xs">Imagen (URL opcional)</Label><Input value={pushForm.image_url || ''} onChange={e => setPushForm({...pushForm, image_url: e.target.value})} placeholder="https://..." className="rounded-xl mt-1" data-testid="push-image" /></div>
          <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90" data-testid="push-send-btn"><Send className="w-4 h-4 mr-2" /> Enviar Notificacion</Button>
        </form>
      </div>
      {pushHistory.length > 0 && (
        <div>
          <h3 className="font-heading text-lg font-semibold mb-3">Historial</h3>
          <div className="space-y-2">
            {pushHistory.map((n, i) => (
              <div key={n._id} className="bg-white rounded-xl p-4 border border-border" data-testid={`push-history-${i}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-xs">{n.recipients_count} destinatarios</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.sent_at).toLocaleString('es')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
