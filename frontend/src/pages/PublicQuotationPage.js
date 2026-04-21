import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Loader2, Check, X as XIcon, Phone, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { QuotationCardPreview } from './admin/QuotationPreview';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API = process.env.REACT_APP_BACKEND_URL;

export default function PublicQuotationPage() {
  const { token } = useParams();
  const [quot, setQuot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  useDocumentTitle('Tu Cotización - Kuxtal Travels');

  useEffect(() => {
    axios.get(`${API}/api/quotations/public/${token}`)
      .then(r => setQuot(r.data))
      .catch(() => setQuot(null))
      .finally(() => setLoading(false));
  }, [token]);

  const decide = async (decision) => {
    setDeciding(true);
    try {
      await axios.post(`${API}/api/quotations/public/${token}/decision`, { decision });
      setQuot(q => ({ ...q, status: decision }));
      toast.success(decision === 'approved' ? '¡Cotización aprobada!' : 'Cotización rechazada');
    } catch {
      toast.error('Error al procesar la decisión');
    }
    setDeciding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!quot) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Cotización no encontrada</h1>
          <p className="text-muted-foreground">El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const decided = quot.status === 'approved' || quot.status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background py-10 px-4" data-testid="public-quot-page">
      <div className="max-w-2xl mx-auto">
        <QuotationCardPreview quot={quot} />

        {!decided && (
          <div className="mt-6 bg-white rounded-2xl border border-border p-6 text-center" data-testid="decision-panel">
            <p className="text-sm font-semibold mb-3">¿Te gusta esta cotización?</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => decide('approved')}
                disabled={deciding}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="approve-btn"
              >
                <Check className="w-4 h-4 mr-2" /> Aceptar cotización
              </Button>
              <Button
                onClick={() => decide('rejected')}
                disabled={deciding}
                variant="outline"
                className="rounded-full"
                data-testid="reject-btn"
              >
                <XIcon className="w-4 h-4 mr-2" /> No me interesa
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Al aceptar, nuestro equipo te contactará para los siguientes pasos.
            </p>
          </div>
        )}

        {decided && (
          <div className={`mt-6 rounded-2xl p-6 text-center ${quot.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-secondary border border-border'}`}>
            <p className="font-semibold text-sm">
              {quot.status === 'approved'
                ? '✓ Has aceptado esta cotización. Nuestro equipo te contactará pronto.'
                : 'Cotización rechazada. Si cambias de opinión, contáctanos.'}
            </p>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>¿Tienes preguntas? Contáctanos</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="https://wa.me/50255555555" className="hover:text-primary inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
            <a href="mailto:info@kuxtaltravels.com" className="hover:text-primary inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}
