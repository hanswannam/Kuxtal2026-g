import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Store, Gift } from 'lucide-react';

export function MemberBenefits({ commerces }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="member-benefits">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-heading text-lg font-semibold">Comercios Aliados</h2>
        <Link to="/benefits">
          <Button variant="outline" size="sm" className="rounded-full" data-testid="view-all-benefits">Ver todos</Button>
        </Link>
      </div>
      {commerces.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin comercios disponibles</h3>
          <p className="text-sm text-muted-foreground">Pronto se agregaran comercios con beneficios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {commerces.map((c, i) => (
            <Link key={c._id} to={`/commerce/${c._id}`} className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-all group" data-testid={`member-commerce-${i}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-xl shrink-0">
                  <Store className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                  <Badge variant="secondary" className="rounded-full text-xs mt-1">{c.category}</Badge>
                </div>
              </div>
              {c.benefit_description && (
                <div className="p-3 bg-accent/50 rounded-xl">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <Gift className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-2">{c.benefit_description}</span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
