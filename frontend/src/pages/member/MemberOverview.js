import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { FileText, Bell, MessageSquare, Package, Store, Gift } from 'lucide-react';

export function MemberOverview({ member, quotations, announcements, vacationRequests, packages, commerces }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {member && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border" data-testid="member-info-card">
          <h2 className="font-heading text-lg font-semibold mb-4">Mi Membresia</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Contrato</p>
              <p className="font-semibold text-base sm:text-lg">{member.contract_number}</p>
            </div>
            <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Anios de Servicio</p>
              <p className="font-semibold text-base sm:text-lg">{member.service_years} anios</p>
            </div>
            <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Vigencia</p>
              <p className="font-semibold text-xs sm:text-sm">{member.membership_start} - {member.membership_end}</p>
            </div>
            <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Familiares</p>
              <p className="font-semibold text-base sm:text-lg">{member.family_members_allowed} personas</p>
            </div>
            {(member.investment_amount > 0 || member.investment_plan) && (
              <div className="p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/10 col-span-2">
                <p className="text-[10px] sm:text-xs text-primary uppercase tracking-wider mb-1 font-semibold">Inversion</p>
                <p className="font-bold text-xl sm:text-2xl text-primary">Q.{(member.investment_amount || 0).toLocaleString()}</p>
                {member.investment_plan && <p className="text-xs text-muted-foreground mt-1">{member.investment_plan}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-xl"><FileText className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{quotations.length}</p>
              <p className="text-xs text-muted-foreground">Cotizaciones</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-xl"><Bell className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-xs text-muted-foreground">Anuncios</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-xl"><MessageSquare className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{vacationRequests.length}</p>
              <p className="text-xs text-muted-foreground">Solicitudes</p>
            </div>
          </div>
        </div>
      </div>

      {packages.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-border">
          <h2 className="font-heading text-lg font-semibold mb-4">Promociones Exclusivas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <a key={pkg._id} href={`/trip/${pkg._id}`} className="group rounded-xl overflow-hidden border border-border hover:shadow-md transition-all">
                <div className="aspect-video overflow-hidden">
                  <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{pkg.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{pkg.duration_days} dias</span>
                    <span className="text-sm font-bold text-primary">Q.{pkg.member_price > 0 ? pkg.member_price.toLocaleString() : pkg.price?.toLocaleString()}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
