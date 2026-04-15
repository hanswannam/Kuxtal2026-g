import React from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle2, X } from 'lucide-react';

export function AdminRequests({ vacationReqs, updateReqStatus }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="admin-requests">
      <h2 className="font-heading text-lg font-semibold">Solicitudes de Vacaciones ({vacationReqs.length})</h2>
      {vacationReqs.map((r, i) => (
        <div key={r._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`admin-request-${i}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{r.destination}</h3>
              <p className="text-xs text-muted-foreground">{r.user_name} &middot; {r.travel_date} &middot; {r.guests} huespedes</p>
            </div>
            <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="rounded-full">
              {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobada' : 'Rechazada'}
            </Badge>
          </div>
          {r.messages?.map((m, j) => (
            <div key={`${m.from}-${j}`} className="text-sm mt-1"><span className="font-medium text-xs">{m.from}:</span><span className="text-muted-foreground ml-1">{m.text}</span></div>
          ))}
          {r.status === 'pending' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Button size="sm" onClick={() => updateReqStatus(r._id, 'approved')} className="rounded-full bg-emerald-600 hover:bg-emerald-700" data-testid={`approve-req-${i}`}><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar</Button>
              <Button size="sm" variant="outline" onClick={() => updateReqStatus(r._id, 'rejected')} className="rounded-full text-destructive" data-testid={`reject-req-${i}`}><X className="w-3 h-3 mr-1" /> Rechazar</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
