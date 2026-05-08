import React from 'react';

/**
 * Tarjeta de membresía estilo "Golden Member" de Kuxtal Travels.
 * Usa el arte oficial (mostaza + hexágonos negros + logo Kuxtal Travels) como fondo
 * y superpone los datos del socio con un panel translúcido para legibilidad.
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
        backgroundImage: 'url(/membership-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#B89327',
      }}
      data-testid="membership-card"
    >
      {/* Panel translúcido central para legibilidad (no tapa logo Kuxtal de la imagen) */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '6%',
          top: '12%',
          right: '32%',
          bottom: '10%',
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)',
          borderRadius: '14px',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Contenido sobre el panel */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6 text-white">
        {/* Encabezado */}
        <div className="max-w-[68%]">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.28em] font-semibold mb-1"
            style={{ color: '#F5D27A' }}
            data-testid="card-tier"
          >
            Golden Member
          </p>
          <p
            className="text-lg sm:text-xl font-bold tracking-wide"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            data-testid="card-contract"
          >
            Contrato #{contractNumber || '---'}
          </p>
        </div>

        {/* Pie: nombre + fechas (logo Kuxtal está en la imagen abajo-derecha) */}
        <div className="max-w-[64%]">
          <p
            className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Socio principal
          </p>
          <p
            className="font-heading text-base sm:text-lg font-bold leading-tight truncate"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
            data-testid="card-name"
          >
            {name || '---'}
          </p>
          <div className="mt-3 flex gap-4 text-[10px] sm:text-xs">
            <div>
              <p
                className="uppercase tracking-wider text-[8px] sm:text-[9px]"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Inicio
              </p>
              <p className="font-semibold" data-testid="card-start">{fmt(startDate)}</p>
            </div>
            <div>
              <p
                className="uppercase tracking-wider text-[8px] sm:text-[9px]"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Vencimiento
              </p>
              <p className="font-semibold" data-testid="card-end">{fmt(endDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
