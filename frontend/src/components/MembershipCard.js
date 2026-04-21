import React from 'react';
import { Plane } from 'lucide-react';

/**
 * Tarjeta de membresía estilo "Golden Member" de Kuxtal Travels.
 * Muestra nombre del socio principal, número de contrato y vigencia
 * sobre un fondo dorado con patrón hexagonal oscuro (inspirado en el PDF).
 */
export function MembershipCard({ name, contractNumber, startDate, endDate }) {
  const fmt = (d) => {
    if (!d) return '--/--/----';
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div
      className="relative w-full max-w-md aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl select-none"
      style={{
        background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 60%, #8B6914 100%)',
      }}
      data-testid="membership-card"
    >
      {/* Patrón hexagonal SVG de fondo */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
            <polygon
              points="20,2 37,12 37,34 20,44 3,34 3,12"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="0.8"
            />
          </pattern>
          <radialGradient id="hexMask" cx="20%" cy="20%" r="90%">
            <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#1A1A1A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="250" fill="url(#hexPattern)" />
        {/* Decoraciones hexagonales más marcadas en esquinas */}
        <g fill="#1A1A1A" opacity="0.35">
          <polygon points="370,10 395,25 395,55 370,70 345,55 345,25" />
          <polygon points="400,70 420,82 420,104 400,116 380,104 380,82" />
          <polygon points="340,0 360,12 360,32 340,44 320,32 320,12" />
        </g>
        <g fill="#1A1A1A" opacity="0.3">
          <polygon points="30,210 55,225 55,255 30,270 5,255 5,225" />
          <polygon points="75,180 95,192 95,214 75,226 55,214 55,192" />
        </g>
      </svg>

      {/* Overlay gradient sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.15) 100%)' }}
      />

      {/* Encabezado */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6 text-white">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-white/90 mb-1" data-testid="card-tier">
            Golden Member
          </p>
          <p className="text-lg sm:text-xl font-bold tracking-wide" data-testid="card-contract">
            Contrato #{contractNumber || '---'}
          </p>
        </div>

        {/* Contenido inferior: nombre + fechas + logo */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/70 mb-1">Socio principal</p>
            <p
              className="font-heading text-base sm:text-lg font-bold leading-tight truncate"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              data-testid="card-name"
            >
              {name || '---'}
            </p>
            <div className="mt-3 flex gap-4 text-[10px] sm:text-xs">
              <div>
                <p className="uppercase tracking-wider text-white/70 text-[8px] sm:text-[9px]">Inicio</p>
                <p className="font-semibold" data-testid="card-start">{fmt(startDate)}</p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-white/70 text-[8px] sm:text-[9px]">Vencimiento</p>
                <p className="font-semibold" data-testid="card-end">{fmt(endDate)}</p>
              </div>
            </div>
          </div>

          {/* Logo-mark */}
          <div className="shrink-0 flex flex-col items-end">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mt-2 font-bold text-white">Kuxtal Travels</p>
            <p className="text-[6px] sm:text-[7px] uppercase tracking-[0.15em] text-white/70 italic">
              Cada destino una historia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
