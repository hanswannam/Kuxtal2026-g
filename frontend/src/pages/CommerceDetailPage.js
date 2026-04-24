import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { MapPin, Phone, Mail, Globe, Gift, ArrowLeft, Calendar, Star, CheckCircle2, ExternalLink, Play, Image, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import ScratchCanvas from '../components/ScratchCanvas';
import ImageWithFallback from '../components/ImageWithFallback';

const API = process.env.REACT_APP_BACKEND_URL;

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

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
    } catch (err) { toast.error(err.response?.data?.detail || 'Código inválido'); }
    setValidating(false);
  };

  const handleScratch = async () => {
    if (!user) { toast.error('Inicia sesión para jugar'); return; }
    try {
      const { data } = await axios.post(`${API}/api/commerce/${id}/scratch-card/play`, {}, { withCredentials: true });
      setScratchResult(data);
      setScratched(true);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al jugar'); }
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!commerce) return <div className="min-h-screen pt-24 flex flex-col items-center justify-center"><h2 className="font-heading text-2xl font-bold mb-4">Comercio no encontrado</h2><Link to="/benefits"><Button className="rounded-full">Volver</Button></Link></div>;

  const embedUrl = getYoutubeEmbedUrl(commerce.youtube_video);
  const hasPhotos = commerce.photos && commerce.photos.length > 0;
  const hasSocial = commerce.social_facebook || commerce.social_instagram || commerce.social_tiktok || commerce.social_twitter;
  const hasMaps = commerce.google_maps_url || commerce.waze_url;

  return (
    <div className="min-h-screen pt-24 pb-16 relative" data-testid="commerce-detail-page" style={{ background: 'radial-gradient(ellipse at top, #1a1a24 0%, #0B0B0F 55%, #050507 100%)' }}>
      {/* Subtle gold radials */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(212,175,90,0.45) 0, transparent 40%), radial-gradient(circle at 85% 80%, rgba(212,175,90,0.25) 0, transparent 45%)' }} />
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(212,175,90,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,90,0.5) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/benefits" className="inline-flex items-center gap-1 text-[#F4EBD0]/60 text-xs uppercase tracking-[0.18em] font-semibold mb-6 hover:text-[#D4AF5A] transition-colors" data-testid="back-to-benefits">
          <ArrowLeft className="w-4 h-4" /> Volver a beneficios
        </Link>

        {/* Header Card — obsidian + gold */}
        <div
          className="relative rounded-[22px] overflow-hidden ring-1 ring-[#D4AF5A]/20 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] mb-6"
          data-testid="commerce-header"
          style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 55%, #0B0B0F 100%)' }}
        >
          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#D4AF5A] to-transparent opacity-80" />
          <div className="absolute top-0 right-0 w-40 h-40 rounded-bl-full bg-gradient-to-bl from-[#D4AF5A]/10 to-transparent pointer-events-none" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#D4AF5A]/40 via-transparent to-[#D4AF5A]/40 blur-md" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDFCF7 0%, #F4EBD0 100%)', boxShadow: 'inset 0 0 0 2px rgba(212,175,90,0.3), 0 10px 30px -10px rgba(0,0,0,0.6)' }}>
                {commerce.logo_url ? <img src={commerce.logo_url} alt={commerce.name} className="w-full h-full object-contain p-3" /> : <ImageWithFallback src="" alt={commerce.name} className="w-full h-full" />}
              </div>
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4AF5A]/10 border border-[#D4AF5A]/25 text-[#E5C989] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                {commerce.category}
              </span>
              <h1 className="font-heading text-2xl sm:text-4xl font-black text-[#F4EBD0] tracking-tight leading-[1.05] break-words">{commerce.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 my-3">
                <div className="h-px w-10 bg-gradient-to-r from-[#D4AF5A]/60 to-transparent" />
                <Star className="w-3 h-3 text-[#D4AF5A] fill-current" />
                <div className="h-px w-10 bg-gradient-to-l from-[#D4AF5A]/60 to-transparent" />
              </div>
              {commerce.location && (
                <p className="text-sm text-[#F4EBD0]/60 flex items-center justify-center sm:justify-start gap-1.5 italic tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF5A]/70" /> {commerce.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* YouTube Video */}
        {embedUrl && (
          <div className="rounded-[22px] overflow-hidden ring-1 ring-[#D4AF5A]/15 mb-6" data-testid="commerce-video" style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 100%)' }}>
            <div className="aspect-video">
              <iframe src={embedUrl} title="Video del comercio" className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          </div>
        )}

        {/* Photos */}
        {hasPhotos && (
          <div className="rounded-[22px] p-5 ring-1 ring-[#D4AF5A]/15 mb-6" data-testid="commerce-photos" style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 100%)' }}>
            <h2 className="font-heading text-lg font-bold text-[#F4EBD0] mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-[#D4AF5A]" /> Galería</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {commerce.photos.map((url) => (
                <div key={url} className="aspect-square rounded-xl overflow-hidden ring-1 ring-[#D4AF5A]/15">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {commerce.description && (
          <div className="rounded-[22px] p-6 ring-1 ring-[#D4AF5A]/15 mb-6" data-testid="commerce-desc" style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 100%)' }}>
            <h2 className="font-heading text-lg font-bold text-[#F4EBD0] mb-3">Acerca del comercio</h2>
            <p className="text-[#F4EBD0]/75 leading-relaxed italic">{commerce.description}</p>
          </div>
        )}

        {/* Benefit — Gold Signature Card */}
        {commerce.benefit_description && (
          <div className="relative rounded-[22px] p-7 ring-1 ring-[#D4AF5A]/40 shadow-[0_20px_50px_-20px_rgba(212,175,90,0.4)] mb-6 overflow-hidden" data-testid="commerce-benefit" style={{ background: 'linear-gradient(145deg, #1a1510 0%, #0F0F14 100%)' }}>
            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-transparent via-[#D4AF5A] to-transparent" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#D4AF5A]/15 blur-3xl pointer-events-none" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF5A]/15 border border-[#D4AF5A]/30 text-[#E5C989] text-[10px] font-bold uppercase tracking-[0.22em] mb-3">
                <Gift className="w-3 h-3" /> Beneficio Exclusivo
              </span>
              <h2
                className="font-heading text-2xl sm:text-3xl font-black leading-tight mt-2 mb-3"
                style={{ background: 'linear-gradient(92deg, #B8944A 0%, #F5E6B8 50%, #D4AF5A 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                Para Socios Kuxtal
              </h2>
              <p className="text-[#F4EBD0]/85 text-base leading-relaxed">{commerce.benefit_description}</p>
            </div>
          </div>
        )}

        {/* Social Media */}
        {hasSocial && (
          <div className="rounded-[22px] p-5 ring-1 ring-[#D4AF5A]/15 mb-6" data-testid="commerce-social" style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 100%)' }}>
            <h2 className="font-heading text-lg font-bold text-[#F4EBD0] mb-4">Redes Sociales</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { url: commerce.social_facebook, icon: Facebook, label: 'Facebook' },
                { url: commerce.social_instagram, icon: Instagram, label: 'Instagram' },
                { url: commerce.social_tiktok, icon: Globe, label: 'TikTok' },
                { url: commerce.social_twitter, icon: Globe, label: 'X / Twitter' },
              ].filter(s => s.url).map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D4AF5A]/5 border border-[#D4AF5A]/25 text-[#E5C989] text-sm font-semibold hover:bg-[#D4AF5A]/15 hover:border-[#D4AF5A]/50 transition-all">
                  <s.icon className="w-4 h-4" /> {s.label} <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Location & Maps + Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Location */}
          <div className="rounded-[22px] p-5 ring-1 ring-[#D4AF5A]/15" data-testid="commerce-location" style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 100%)' }}>
            <h2 className="font-heading text-lg font-bold text-[#F4EBD0] mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#D4AF5A]" /> Ubicación</h2>
            <div className="space-y-2">
              {commerce.location && <p className="font-semibold text-[#F4EBD0]">{commerce.location}</p>}
              {commerce.address && <p className="text-sm text-[#F4EBD0]/55">{commerce.address}</p>}
              {hasMaps && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {commerce.google_maps_url && (
                    <a href={commerce.google_maps_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium hover:bg-blue-100 hover:shadow-md transition-all hover:-translate-y-0.5"
                      data-testid="detail-gmaps-btn">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Google Maps
                    </a>
                  )}
                  {commerce.waze_url && (
                    <a href={commerce.waze_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-sm font-medium hover:bg-sky-100 hover:shadow-md transition-all hover:-translate-y-0.5"
                      data-testid="detail-waze-btn">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 2.3.8 4.4 2.1 6.1l-.7 2.5 2.6-.7C7.6 21.2 9.7 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm-1 6c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm4 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-5 7c-1.1 0-2-.4-2.8-1.1l1.4-1.4c.4.3.9.5 1.4.5s1-.2 1.4-.5l1.4 1.4C11.9 14.6 11 15 10 15z"/></svg>
                      Waze
                    </a>
                  )}
                </div>
              )}
              {!commerce.location && !commerce.address && !hasMaps && (
                <p className="text-sm text-muted-foreground">Sin ubicación registrada</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-5 border border-border" data-testid="commerce-contact">
            <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Contacto</h2>
            <div className="space-y-3">
              {commerce.phone && (
                <a href={`tel:${commerce.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition-colors" data-testid="call-btn">
                  <Phone className="w-5 h-5" /> {commerce.phone}
                </a>
              )}
              {commerce.email && (
                <a href={`mailto:${commerce.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground/80 text-sm transition-colors">
                  <Mail className="w-4 h-4 text-primary" /> {commerce.email}
                </a>
              )}
              {commerce.website && (
                <a href={commerce.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground/80 text-sm transition-colors">
                  <Globe className="w-4 h-4 text-primary" /> Sitio web <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
              {!commerce.phone && !commerce.email && (
                <p className="text-sm text-muted-foreground">Sin información de contacto</p>
              )}
            </div>
          </div>
        </div>

        {/* Validate Visit */}
        {user && (user.role === 'member') && (
          <div className="bg-white rounded-2xl p-6 border border-border mb-6" data-testid="validate-visit">
            <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Validar Visita
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Pide al comercio el código de validación para registrar tu visita</p>
            <div className="flex gap-2 max-w-sm">
              <Input value={validationCode} onChange={e => setValidationCode(e.target.value.toUpperCase())} placeholder="Código de validación" className="rounded-xl font-mono uppercase" data-testid="validation-code-input" />
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
                <button onClick={() => { if(user) { setShowScratch(true); setScratched(false); setScratchResult(null); } else toast.error('Inicia sesión para jugar'); }} className="mx-auto block" data-testid="scratch-start-btn">
                  <div className="relative w-72 h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center cursor-pointer group shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,0.15) 5px,rgba(255,255,255,0.15) 10px)'}} />
                    <div className="text-white text-center z-10 group-hover:scale-105 transition-transform">
                      <Star className="w-10 h-10 mx-auto mb-2 fill-white text-white" />
                      <p className="font-heading text-lg font-bold">Raspa y Gana</p>
                      <p className="text-xs text-white/70 mt-1">Toca para empezar</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : !scratched ? (
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-3">Desliza con el dedo o mouse para raspar</p>
                <ScratchCanvas width={280} height={180} onComplete={handleScratch}
                  resultContent={scratchResult ? (
                    <div className={`w-full h-full flex flex-col items-center justify-center rounded-2xl ${scratchResult.won ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>
                      <p className="text-white font-heading text-2xl font-bold">{scratchResult.won ? '🎉 ¡Ganaste!' : '😔'}</p>
                      <p className="text-white/90 text-sm mt-2 px-4 text-center">{scratchResult.message}</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                />
                {scratched && (
                  <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setShowScratch(false); setScratched(false); setScratchResult(null); }} data-testid="scratch-again-btn">
                    Intentar de nuevo
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center animate-fade-in" data-testid="scratch-result">
                <div className={`w-72 h-44 rounded-2xl flex flex-col items-center justify-center shadow-lg ${scratchResult?.won ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>
                  <p className="text-white font-heading text-2xl font-bold">{scratchResult?.won ? '🎉 ¡Ganaste!' : '😔'}</p>
                  <p className="text-white/90 text-sm mt-2 px-4 text-center">{scratchResult?.message}</p>
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
              <div key={p._id} className="bg-white rounded-2xl overflow-hidden border border-border" data-testid={`promo-${i}`}>
                <div className="flex items-start gap-4 p-5">
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
