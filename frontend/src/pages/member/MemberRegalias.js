import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Gift, Calendar, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { CountdownTimer } from '../../components/CountdownTimer';
import ImageWithFallback from '../../components/ImageWithFallback';

export function MemberRegalias() {
  const [regalias, setRegalias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/regalias')
      .then(r => setRegalias(r.data))
      .catch(e => console.error('Failed to load regalias:', e))
      .finally(() => setLoading(false));
  }, []);

  const isExpired = (d) => d && new Date(d) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="member-regalias-loading">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="member-regalias">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold">Mis Regalías</h2>
        <p className="text-sm text-muted-foreground">Certificados y regalos asignados a tu membresía</p>
      </div>

      {regalias.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin regalías</h3>
          <p className="text-sm text-muted-foreground">Aún no se te ha asignado ninguna regalía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regalias.map((r, i) => (
            <div
              key={r._id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${r.used ? 'opacity-60 border-border' : isExpired(r.end_date) ? 'border-destructive/30' : 'border-primary/20'}`}
              data-testid={`member-regalia-${i}`}
            >
              {r.image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <ImageWithFallback src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{r.name}</h3>
                  {r.used ? (
                    <Badge variant="secondary" className="rounded-full text-xs">Usada</Badge>
                  ) : isExpired(r.end_date) ? (
                    <Badge variant="destructive" className="rounded-full text-xs">Vencida</Badge>
                  ) : (
                    <Badge className="rounded-full text-xs bg-primary text-white">Activa</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {r.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.start_date).toLocaleDateString('es')}
                    </span>
                  )}
                  {r.end_date && <span>→ {new Date(r.end_date).toLocaleDateString('es')}</span>}
                </div>
                {r.end_date && !r.used && (
                  <div className="mt-3">
                    <CountdownTimer endDate={r.end_date} label="Válido por" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
