import React, { useEffect, useState } from 'react';
import { Building2, MapPin, Check, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export function MemberClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clubs')
      .then(r => setClubs(r.data))
      .catch(e => console.error('Failed to load clubs:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="member-clubs-loading">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="member-clubs">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold">Clubs Vacacionales</h2>
        <p className="text-sm text-muted-foreground">Todos los clubs disponibles para ti como socio</p>
      </div>

      {clubs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin clubs disponibles</h3>
          <p className="text-sm text-muted-foreground">Pronto verás aquí los clubs vacacionales del programa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map((c, i) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all"
              data-testid={`member-club-${i}`}
            >
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{c.address}
                      </p>
                    )}
                  </div>
                </div>
                {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}
                {c.benefits?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Beneficios</p>
                    {c.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-accent-foreground shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
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
