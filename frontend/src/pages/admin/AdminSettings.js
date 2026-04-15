import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Phone, MessageSquare } from 'lucide-react';

export function AdminSettings({ whatsappPhone, setWhatsappPhone, saveWhatsApp, stats }) {
  return (
    <div className="max-w-md space-y-6 animate-fade-in" data-testid="admin-settings">
      <div className="bg-white rounded-2xl p-6 border border-border">
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> WhatsApp</h2>
        <p className="text-sm text-muted-foreground mb-4">Configura el numero de WhatsApp para el widget de chat</p>
        <div className="flex gap-2">
          <Input value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} placeholder="+502 5555-1234" className="rounded-xl" data-testid="whatsapp-input" />
          <Button onClick={saveWhatsApp} className="rounded-xl bg-primary hover:bg-primary/90" data-testid="save-whatsapp-btn">Guardar</Button>
        </div>
      </div>
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
