import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Calendar, MessageSquare, Send } from 'lucide-react';

export function MemberRequests({ vacationRequests, showRequestForm, setShowRequestForm, reqForm, setReqForm, submitRequest }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="member-requests">
      <div className="flex justify-end mb-2">
        <Button onClick={() => setShowRequestForm(true)} className="rounded-full bg-primary hover:bg-primary/90" data-testid="new-request-btn">
          <Send className="w-4 h-4 mr-2" /> Nueva Solicitud
        </Button>
      </div>
      {vacationRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin solicitudes</h3>
          <p className="text-sm text-muted-foreground">Envia tu primera solicitud de vacaciones</p>
        </div>
      ) : (
        vacationRequests.map((r, i) => (
          <div key={r._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`vacation-request-${i}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{r.destination}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> {r.travel_date} &middot; {r.guests} huespedes
                </p>
              </div>
              <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="rounded-full">
                {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobada' : 'Rechazada'}
              </Badge>
            </div>
            {r.messages && r.messages.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-border">
                {r.messages.map((m, j) => (
                  <div key={`${m.from}-${j}`} className="text-sm">
                    <span className="font-medium text-xs">{m.from}:</span>
                    <span className="text-muted-foreground ml-2">{m.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="request-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-xl font-semibold mb-4">Nueva Solicitud de Vacaciones</h3>
            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <Label>Destino</Label>
                <Input value={reqForm.destination} onChange={e => setReqForm({...reqForm, destination: e.target.value})} required className="rounded-xl mt-1" data-testid="req-destination" />
              </div>
              <div>
                <Label>Fecha de viaje</Label>
                <Input type="date" value={reqForm.travel_date} onChange={e => setReqForm({...reqForm, travel_date: e.target.value})} required className="rounded-xl mt-1" data-testid="req-date" />
              </div>
              <div>
                <Label>Huespedes</Label>
                <Input type="number" min="1" value={reqForm.guests} onChange={e => setReqForm({...reqForm, guests: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="req-guests" />
              </div>
              <div>
                <Label>Mensaje</Label>
                <Textarea value={reqForm.message} onChange={e => setReqForm({...reqForm, message: e.target.value})} className="rounded-xl mt-1" data-testid="req-message" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="req-submit">Enviar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
