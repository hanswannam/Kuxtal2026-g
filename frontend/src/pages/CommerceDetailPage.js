import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { MapPin, Phone, Mail, Globe, Gift, ArrowLeft, Calendar, Star, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function CommerceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [commerce, setCommerce] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [scratchCard, setScratchCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validationCode, setValidationCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [showScratch, setShowScratch] = useState(false);
  const [scratchResult, setScratchResult] = useState(null);
  const [scratched, setScratched] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/commerce/${id}`),
      axios.get(`${API}/api/commerce/${id}/promotions`),
      axios.get(`${API}/api/commerce/${id}/scratch-card`),
    ]).then(([c, p, s]) => {
      setCommerce(c.data);
      setPromotions(p.data);
      setScratchCard(s.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleValidate = async () => {
    if (!user) { toast.error('Inicia sesión para validar tu visita'); return; }
    setValidating(true);
    try {
      const { data } = await axios.post(`${API}/api/commerce/${id}/validate`, { code: validationCode }, { withCredentials: true });
      toast.success(`${data.message} - Total de visitas: ${data.total_visits}`);
      setValidationCode('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código inválido');
    }
    setValidating(false);
  };

  const handleScratch = async () => {
    if (!user) { toast.error('Inicia sesión para jugar'); return; }
    try {
      const { data } = await axios.post(`${API}/api/commerce/${id}/scratch-card/play`, {}, { withCredentials: true });
      setScratchResult(data);
      setScratched(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al jugar');
    }
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!commerce) return <div className="min-h-screen pt-24 flex flex-col items-center justify-center"><h2 className="font-heading text-2xl font-bold mb-4">Comercio no encontrado</h2><Link to="/benefits"><Button className="rounded-full">Volver</Button></Link></div>;

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="commerce-detail-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/benefits" className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-6 hover:text-primary transition-colors" data-testid="back-to-benefits">
          <ArrowLeft className="w-4 h-4" /> Volver a beneficios
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border mb-6" data-testid="commerce-header">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-3xl shrink-0">
              {commerce.logo_url ? <img src={commerce.logo_url} alt={commerce.name} className="w-full h-full object-cover rounded-2xl" /> : '🏪'}
            </div>
            <div>
              <Badge variant="secondary" className="rounded-full text-xs mb-2">{commerce.category}</Badge>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">{commerce.name}</h1>
              <p className="text-muted-foreground">{commerce.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            {commerce.location && (
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-primary" /> {commerce.location}</div>
            )}
            {commerce.phone && (
              <a href={`tel:${commerce.phone}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors"><Phone className="w-4 h-4 text-primary" /> {commerce.phone}</a>
            )}
            {commerce.email && (
              <a href={`mailto:${commerce.email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors"><Mail className="w-4 h-4 text-primary" /> {commerce.email}</a>
            )}
          </div>
        </div>

        {/* Benefit */}
        {commerce.benefit_description && (
          <div className="bg-accent/50 rounded-2xl p-6 border border-primary/10 mb-6" data-testid="commerce-benefit">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-xl font-semibold">Beneficio Exclusivo</h2>
            </div>
            <p className="text-foreground/80">{commerce.benefit_description}</p>
          </div>
        )}

        {/* Validate Visit */}
        {user && (user.role === 'member') && (
          <div className="bg-white rounded-2xl p-6 border border-border mb-6" data-testid="validate-visit">
            <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Validar Visita
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Pide al comercio el código de validación para registrar tu visita</p>
            <div className="flex gap-2 max-w-sm">
              <Input
                value={validationCode}
                onChange={e => setValidationCode(e.target.value.toUpperCase())}
                placeholder="Código de validación"
                className="rounded-xl font-mono uppercase"
                data-testid="validation-code-input"
              />
              <Button onClick={handleValidate} disabled={validating || !validationCode} className="rounded-xl bg-primary hover:bg-primary/90" data-testid="validate-btn">
                {validating ? 'Validando...' : 'Validar'}
              </Button>
            </div>
          </div>
        )}

        {/* Scratch Card */}
        {scratchCard && (
          <div className="bg-white rounded-2xl p-6 border border-border mb-6" data-testid="scratch-card-section">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Raspa y Gana
            </h2>
            {!showScratch ? (
              <div className="text-center">
                <div className="relative w-64 h-40 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center cursor-pointer group" onClick={() => { if(user) setShowScratch(true); else toast.error('Inicia sesión para jugar'); }}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                  <div className="text-white text-center z-10 group-hover:scale-105 transition-transform">
                    <Star className="w-10 h-10 mx-auto mb-2 fill-amber-300 text-amber-300" />
                    <p className="font-heading text-lg font-bold">Raspa aquí</p>
                    <p className="text-xs text-white/70">Toca para jugar</p>
                  </div>
                </div>
              </div>
            ) : !scratched ? (
              <div className="text-center">
                <div className="relative w-64 h-40 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cursor-pointer scratch-surface" onClick={handleScratch} data-testid="scratch-play-btn">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.1)_5px,rgba(255,255,255,0.1)_10px)]" />
                  <p className="text-white font-heading text-xl font-bold z-10 animate-pulse">Toca para raspar</p>
                </div>
              </div>
            ) : (
              <div className="text-center animate-fade-in" data-testid="scratch-result">
                <div className={`w-64 h-40 mx-auto rounded-2xl flex flex-col items-center justify-center ${scratchResult?.won ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>
                  <p className="text-white font-heading text-xl font-bold">{scratchResult?.won ? '🎉 ¡Ganaste!' : '😔'}</p>
                  <p className="text-white/90 text-sm mt-2">{scratchResult?.message}</p>
                </div>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setShowScratch(false); setScratched(false); setScratchResult(null); }} data-testid="scratch-again-btn">
                  Intentar de nuevo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Promotions */}
        {promotions.length > 0 && (
          <div className="space-y-4" data-testid="commerce-promotions">
            <h2 className="font-heading text-lg font-semibold">Promociones Activas</h2>
            {promotions.map((p, i) => (
              <div key={p._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`promo-${i}`}>
                <div className="flex items-start gap-4">
                  {p.image_url && <img src={p.image_url} alt={p.title} className="w-24 h-24 rounded-xl object-cover shrink-0" />}
                  <div>
                    <h3 className="font-semibold mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{p.start_date} - {p.end_date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
