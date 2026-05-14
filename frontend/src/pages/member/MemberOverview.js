import React, { useState } from 'react';
import { FileText, Bell, MessageSquare, MessageCircle, Loader2 } from 'lucide-react';
import { MembershipCard } from '../../components/MembershipCard';
import ImageWithFallback from '../../components/ImageWithFallback';
import api from '../../lib/api';
import { toast } from 'sonner';
import { formatApiError } from '../../lib/errors';

// Elegant gold/mustard palette (matches the membership card art)
const GOLD = '#D4AF37';
const GOLD_DEEP = '#B89327';
const NAVY = '#0D2B45';

const cardBoxStyle = {
  background: 'linear-gradient(135deg, #FDF9EC 0%, #FAF3DD 100%)',
  border: `1px solid rgba(212,175,55,0.35)`,
  boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 22px -16px rgba(184,147,39,0.45)',
};

const labelStyle = { color: GOLD_DEEP, letterSpacing: '0.18em' };
const valueStyle = { color: NAVY };

const investmentBoxStyle = {
  background: 'linear-gradient(135deg, #0D2B45 0%, #14395E 100%)',
  border: '1px solid rgba(212,175,55,0.45)',
  boxShadow: '0 12px 32px -18px rgba(13,43,69,0.55), 0 0 0 1px rgba(212,175,55,0.25) inset',
};

const counterCardStyle = {
  background: '#fff',
  border: '1px solid rgba(212,175,55,0.30)',
  boxShadow: '0 6px 18px -14px rgba(184,147,39,0.40)',
};

export function MemberOverview({ member, quotations, announcements, vacationRequests, packages, commerces }) {
  const [optingOut, setOptingOut] = useState(false);
  const [optedOut, setOptedOut] = useState(!!member?.opt_out_whatsapp);

  const handleOptOut = async () => {
    if (!window.confirm('¿Confirmás que no querés recibir más mensajes promocionales de Kuxtal por WhatsApp? Seguirás recibiendo respuestas a tus consultas y mensajes operativos.')) return;
    setOptingOut(true);
    try {
      await api.post('/broadcasts/opt-out', {});
      setOptedOut(true);
      toast.success('Listo, no recibirás más difusiones masivas.');
    } catch (e) {
      toast.error(formatApiError(e, 'No se pudo procesar la solicitud'));
    }
    setOptingOut(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {member && (
        <div className="flex justify-center sm:justify-start" data-testid="membership-card-wrapper">
          <MembershipCard
            name={member.name}
            contractNumber={member.contract_number}
            startDate={member.membership_start || member.contract_date}
            endDate={member.membership_end || member.termination_date}
          />
        </div>
      )}

      {member && (
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background: '#fff',
            border: '1px solid rgba(212,175,55,0.30)',
            boxShadow: '0 10px 30px -22px rgba(184,147,39,0.4)',
          }}
          data-testid="member-info-card"
        >
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-heading text-lg font-semibold" style={{ color: NAVY }}>
              <span style={{ color: GOLD_DEEP }}>·</span> Mi Membresía
            </h2>
            <span
              className="inline-flex items-center text-[10px] uppercase tracking-[0.22em] font-bold px-3 py-1 rounded-full"
              style={{ color: GOLD_DEEP, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}
            >
              Golden
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl" style={cardBoxStyle}>
              <p className="text-[10px] sm:text-xs uppercase font-semibold mb-1" style={labelStyle}>Contrato</p>
              <p className="font-semibold text-base sm:text-lg" style={valueStyle}>{member.contract_number}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl" style={cardBoxStyle}>
              <p className="text-[10px] sm:text-xs uppercase font-semibold mb-1" style={labelStyle}>Años de Servicio</p>
              <p className="font-semibold text-base sm:text-lg" style={valueStyle}>{member.service_years} años</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl" style={cardBoxStyle}>
              <p className="text-[10px] sm:text-xs uppercase font-semibold mb-1" style={labelStyle}>Vigencia</p>
              <p className="font-semibold text-xs sm:text-sm" style={valueStyle}>{member.membership_start} - {member.membership_end}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl" style={cardBoxStyle}>
              <p className="text-[10px] sm:text-xs uppercase font-semibold mb-1" style={labelStyle}>Familiares</p>
              <p className="font-semibold text-base sm:text-lg" style={valueStyle}>{member.family_members_allowed} personas</p>
            </div>

            {(member.investment_amount > 0 || member.investment_plan) && (
              <div
                className="p-4 sm:p-5 rounded-xl col-span-2 text-white"
                style={investmentBoxStyle}
                data-testid="investment-box"
              >
                <p className="text-[10px] sm:text-xs uppercase font-bold mb-1" style={{ color: '#F5D27A', letterSpacing: '0.22em' }}>
                  Inversión
                </p>
                <p className="font-heading font-bold text-2xl sm:text-3xl tracking-tight" style={{ color: '#fff' }}>
                  Q.{(member.investment_amount || 0).toLocaleString()}
                </p>
                {member.investment_plan && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(245,210,122,0.85)' }}>{member.investment_plan}</p>
                )}
                {member.observations && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.30)' }} data-testid="member-observations">
                    <p className="text-[10px] sm:text-xs uppercase font-bold mb-1" style={{ color: '#F5D27A', letterSpacing: '0.22em' }}>
                      Observaciones
                    </p>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      {member.observations}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!(member.investment_amount > 0 || member.investment_plan) && member.observations && (
              <div className="p-4 rounded-xl col-span-2" style={cardBoxStyle} data-testid="member-observations">
                <p className="text-[10px] sm:text-xs uppercase font-semibold mb-1" style={labelStyle}>Observaciones</p>
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed" style={valueStyle}>{member.observations}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Counter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={counterCardStyle}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.12)' }}>
              <FileText className="w-5 h-5" style={{ color: GOLD_DEEP }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{quotations.length}</p>
              <p className="text-xs" style={{ color: GOLD_DEEP, fontWeight: 600 }}>Cotizaciones</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5" style={counterCardStyle}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.12)' }}>
              <Bell className="w-5 h-5" style={{ color: GOLD_DEEP }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{announcements.length}</p>
              <p className="text-xs" style={{ color: GOLD_DEEP, fontWeight: 600 }}>Anuncios</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5" style={counterCardStyle}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.12)' }}>
              <MessageSquare className="w-5 h-5" style={{ color: GOLD_DEEP }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{vacationRequests.length}</p>
              <p className="text-xs" style={{ color: GOLD_DEEP, fontWeight: 600 }}>Solicitudes</p>
            </div>
          </div>
        </div>
      </div>

      {packages.length > 0 && (
        <div className="rounded-2xl p-6" style={counterCardStyle}>
          <h2 className="font-heading text-lg font-semibold mb-4" style={{ color: NAVY }}>
            Promociones <span style={{ color: GOLD_DEEP }}>Exclusivas</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <a
                key={pkg._id}
                href={`/trip/${pkg._id}`}
                className="group rounded-xl overflow-hidden hover:shadow-md transition-all"
                style={{ border: '1px solid rgba(212,175,55,0.28)' }}
              >
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3" style={{ background: '#FDF9EC' }}>
                  <h3 className="font-medium text-sm transition-colors line-clamp-1" style={{ color: NAVY }}>{pkg.title}</h3>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs whitespace-nowrap" style={{ color: GOLD_DEEP }}>{pkg.duration_days} días</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-right leading-tight"
                      style={{ color: GOLD_DEEP }}
                    >
                      Precio especial<br />para socios
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Preferencias de comunicación */}
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{
          background: '#fff',
          border: '1px solid rgba(212,175,55,0.30)',
          boxShadow: '0 10px 30px -22px rgba(184,147,39,0.4)',
        }}
        data-testid="member-comms-prefs"
      >
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2" style={{ color: NAVY }}>
          <MessageCircle className="w-4 h-4" style={{ color: GOLD_DEEP }} />
          Preferencias de comunicación
        </h2>
        <p className="text-xs mt-2 text-muted-foreground">
          Recibís mensajes promocionales de Kuxtal Travels por WhatsApp con novedades, ofertas exclusivas para socios y boletines.
        </p>
        {optedOut ? (
          <div className="mt-3 rounded-xl bg-secondary/40 p-3 text-xs flex items-center gap-2" data-testid="opt-out-confirmed">
            <span className="font-semibold text-muted-foreground">✓ Has solicitado no recibir más difusiones masivas.</span>
          </div>
        ) : (
          <button
            onClick={handleOptOut}
            disabled={optingOut}
            className="mt-3 text-xs underline hover:no-underline disabled:opacity-50"
            style={{ color: GOLD_DEEP }}
            data-testid="opt-out-whatsapp-btn"
          >
            {optingOut ? <Loader2 className="inline w-3 h-3 mr-1 animate-spin" /> : null}
            No deseo recibir más difusiones de WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}

// Insert opt-out widget at end of layout (rendered as last block, after packages)
