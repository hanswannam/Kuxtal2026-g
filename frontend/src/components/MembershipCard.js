import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button } from './ui/button';
import { toast } from 'sonner';

/**
 * Tarjeta de membresía estilo "Golden Member" de Kuxtal Travels.
 * Usa el arte oficial (mostaza + hexágonos negros + logo Kuxtal Travels) como fondo.
 */
export function MembershipCard({ name, contractNumber, startDate, endDate }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const fmt = (d) => {
    if (!d) return '--/--/----';
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  const downloadPng = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#B89327',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tarjeta_kuxtal_${contractNumber || 'socio'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Tarjeta descargada');
    } catch (e) {
      toast.error('No se pudo generar la imagen');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-3 items-start" data-testid="membership-card-container">
      <div
        ref={cardRef}
        className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{
          backgroundImage: 'url(/membership-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#B89327',
        }}
        data-testid="membership-card"
      >
        {/* Contenido */}
        <div
          className="relative h-full flex flex-col justify-between p-5 sm:p-6 text-white"
          style={{ paddingLeft: '24%', paddingRight: '28%' }}
        >
          {/* Encabezado */}
          <div>
            <p
              className="text-[10px] sm:text-xs uppercase tracking-[0.28em] font-semibold mb-1"
              style={{ color: '#F5D27A', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
              data-testid="card-tier"
            >
              Golden Member
            </p>
            <p
              className="text-base sm:text-lg font-bold tracking-wide"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)' }}
              data-testid="card-contract"
            >
              Contrato #{contractNumber || '---'}
            </p>
          </div>

          {/* Pie: nombre + fechas */}
          <div>
            <p
              className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1 font-semibold"
              style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              Socio principal
            </p>
            <p
              className="font-heading text-sm sm:text-base font-bold leading-tight truncate"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.75), 0 0 8px rgba(0,0,0,0.45)' }}
              data-testid="card-name"
            >
              {name || '---'}
            </p>
            <div className="mt-3 flex gap-3 text-[10px] sm:text-xs">
              <div>
                <p
                  className="uppercase tracking-wider text-[8px] sm:text-[9px] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  Inicio
                </p>
                <p
                  className="font-semibold"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                  data-testid="card-start"
                >
                  {fmt(startDate)}
                </p>
              </div>
              <div>
                <p
                  className="uppercase tracking-wider text-[8px] sm:text-[9px] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  Vencimiento
                </p>
                <p
                  className="font-semibold"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                  data-testid="card-end"
                >
                  {fmt(endDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={downloadPng}
        disabled={downloading}
        size="sm"
        variant="outline"
        className="rounded-full"
        data-testid="download-card-png-btn"
      >
        {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        {downloading ? 'Generando…' : 'Descargar tarjeta (PNG)'}
      </Button>
    </div>
  );
}
