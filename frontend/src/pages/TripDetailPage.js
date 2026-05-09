import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { MapPin, Star, Calendar, Users, Check, Hotel, Mountain, ArrowLeft, Share2, ChevronLeft, ChevronRight, Sparkles, Lock } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'sonner';
import { CountdownTimer } from '../components/CountdownTimer';
import ImageWithFallback from '../components/ImageWithFallback';

// Luxury palette — consistent with HomePage
const NAVY = '#0D2B45';
const NAVY_DEEP = '#061829';
const GOLD = '#D4AF5A';
const CHAMPAGNE = '#E5C989';
const CREAM_BG = 'linear-gradient(180deg, #FAF8F3 0%, #F3EEE2 60%, #FAF8F3 100%)';

const SERIF = '"Playfair Display", Georgia, serif';

function MetaBadge({ icon: Icon, children }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: '#FFFFFF', border: `1px solid ${GOLD}44`, color: NAVY }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
      {children}
    </span>
  );
}

function SectionCard({ children, testid }) {
  return (
    <div
      className="relative rounded-[22px] p-6 sm:p-7 overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: `0 10px 30px -15px rgba(13,43,69,0.18), 0 0 0 1px ${GOLD}22` }}
      data-testid={testid}
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: '#8B6F2E' }}>{eyebrow}</p>
      </div>
      <h2 className="font-heading text-2xl font-black tracking-tight" style={{ color: NAVY, fontFamily: SERIF }}>{title}</h2>
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: '', email: '', phone: '', contract_number: '', message: '', guests: 2, travel_date: '' });
  const [galleryIndex, setGalleryIndex] = useState(0);
  useDocumentTitle(pkg?.title || 'Detalle del Paquete');

  // Resolve member from auth: normal member or admin browsing as member is fine.
  const linkedMember = user?.role === 'member' ? (user.member || null) : null;
  const isLoggedMember = !!linkedMember;

  // Pre-fill the quote form with the member's data whenever auth changes or modal opens.
  useEffect(() => {
    if (!isLoggedMember) return;
    setQuoteForm(prev => ({
      ...prev,
      name: linkedMember.name || prev.name,
      email: linkedMember.email || prev.email,
      phone: linkedMember.phone || prev.phone,
      contract_number: linkedMember.contract_number || prev.contract_number,
    }));
  }, [isLoggedMember, linkedMember, showQuoteForm]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/packages/${id}`)
      .then(r => { if (!cancelled) { setPkg(r.data); setLoading(false); } })
      .catch(e => {
        console.error('Failed to load package', id, e);
        if (!cancelled) { setPkg(null); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [id]);

  const submitQuote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/quotations`, { ...quoteForm, package_id: id });
      toast.success(isLoggedMember
        ? '¡Listo! La cotización quedó guardada en tu portal.'
        : 'Cotización enviada correctamente');
      setShowQuoteForm(false);
      setQuoteForm({
        name: linkedMember?.name || '',
        email: linkedMember?.email || '',
        phone: linkedMember?.phone || '',
        contract_number: linkedMember?.contract_number || '',
        message: '', guests: 2, travel_date: '',
      });
    } catch { toast.error('Error al enviar cotización'); }
  };

  const allImages = pkg ? [pkg.image_url, ...(Array.isArray(pkg.gallery) ? pkg.gallery : [])].filter(Boolean) : [];
  const memberPrice = Number(pkg?.member_price) || 0;
  const fmtPrice = (v) => (Number(v) || 0).toLocaleString();

  if (loading) return (
    <div className="min-h-screen pt-20" style={{ background: CREAM_BG }}>
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="aspect-[21/9] rounded-2xl mb-8" style={{ background: '#ece6d8' }} />
        <div className="h-8 rounded w-1/2 mb-4" style={{ background: '#ece6d8' }} />
        <div className="h-4 rounded w-full mb-2" style={{ background: '#ece6d8' }} />
        <div className="h-4 rounded w-3/4" style={{ background: '#ece6d8' }} />
      </div>
    </div>
  );

  if (!pkg) return (
    <div className="min-h-screen pt-20 flex items-center justify-center" style={{ background: CREAM_BG }}>
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold mb-3" style={{ color: NAVY, fontFamily: SERIF }}>Paquete no encontrado</h2>
        <Link to="/search">
          <Button className="rounded-full font-bold uppercase tracking-[0.2em] text-xs px-8" style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`, color: NAVY_DEEP, border: `1px solid ${GOLD}` }}>
            Volver a buscar
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 relative overflow-hidden" style={{ background: CREAM_BG }} data-testid="trip-detail-page">
      {/* Top + bottom gold hairlines framing the page */}
      <div className="absolute top-20 left-0 right-0 h-px z-0" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}44, transparent)` }} />
      {/* Subtle gold marble */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 15% 20%, ${GOLD} 0, transparent 45%), radial-gradient(ellipse at 85% 75%, ${GOLD} 0, transparent 45%)` }} />

      {/* Breadcrumb */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link to="/search" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] transition-all hover:gap-3" style={{ color: NAVY }} data-testid="back-to-search">
          <ArrowLeft className="w-4 h-4" style={{ color: GOLD }} /> Volver a resultados
        </Link>
      </div>

      {/* Hero / Gallery */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div
          className="relative rounded-[22px] overflow-hidden aspect-[21/9] sm:aspect-[2.5/1]"
          style={{ boxShadow: `0 25px 60px -20px rgba(13,43,69,0.35), 0 0 0 1px ${GOLD}44` }}
          data-testid="trip-gallery"
        >
          <ImageWithFallback
            src={allImages[galleryIndex]}
            alt={pkg.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />

          {/* Gallery controls */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: `${NAVY_DEEP}dd`, border: `1px solid ${GOLD}66`, backdropFilter: 'blur(8px)', color: CHAMPAGNE }}
                data-testid="gallery-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: `${NAVY_DEEP}dd`, border: `1px solid ${GOLD}66`, backdropFilter: 'blur(8px)', color: CHAMPAGNE }}
                data-testid="gallery-next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={`dot-${i}`}
                    onClick={() => setGalleryIndex(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === galleryIndex ? 32 : 8,
                      background: i === galleryIndex ? GOLD : 'rgba(245,230,184,0.4)',
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Category + Featured badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ background: `${NAVY_DEEP}ee`, color: CHAMPAGNE, border: `1px solid ${GOLD}44`, backdropFilter: 'blur(8px)' }}
            >
              {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
            </span>
            {pkg.featured && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.22em]"
                style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`, color: NAVY_DEEP, border: `1px solid ${GOLD}`, boxShadow: `0 6px 18px -4px rgba(212,175,90,0.6)` }}
              >
                <Sparkles className="w-2.5 h-2.5" /> Exclusivo
              </span>
            )}
          </div>

          {/* Share button */}
          <button
            className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: `${NAVY_DEEP}dd`, border: `1px solid ${GOLD}66`, backdropFilter: 'blur(8px)', color: CHAMPAGNE }}
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Enlace copiado'); }}
            data-testid="share-btn"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
                <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
                <div className="h-px flex-1 max-w-[100px]" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
              </div>
              <h1
                className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.02] mb-4"
                style={{ color: NAVY, fontFamily: SERIF }}
                data-testid="trip-title"
              >
                {pkg.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <MetaBadge icon={MapPin}>{pkg.country}</MetaBadge>
                <MetaBadge icon={Calendar}>{pkg.duration_days} días</MetaBadge>
                <MetaBadge icon={Star}>{pkg.rating}/5</MetaBadge>
                {pkg.accommodation_type && <MetaBadge icon={Hotel}>{pkg.accommodation_type}</MetaBadge>}
                {pkg.difficulty && <MetaBadge icon={Mountain}>{pkg.difficulty}</MetaBadge>}
                {pkg.max_group && <MetaBadge icon={Users}>{pkg.min_group || 1}-{pkg.max_group} personas</MetaBadge>}
              </div>
            </div>

            {/* Description */}
            <SectionCard testid="trip-description-card">
              <SectionHeading eyebrow="Sobre el destino" title="Descripción" />
              <p className="leading-relaxed whitespace-pre-line text-sm sm:text-base" style={{ color: `${NAVY}cc` }} data-testid="trip-description">
                {pkg.description}
              </p>
            </SectionCard>

            {/* Includes */}
            {Array.isArray(pkg.includes) && pkg.includes.length > 0 && (
              <SectionCard testid="trip-includes">
                <SectionHeading eyebrow="Beneficios incluidos" title="Qué incluye" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.includes.map((item, idx) => (
                    <div
                      key={`inc-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ background: `${GOLD}0F`, border: `1px solid ${GOLD}33` }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)` }}
                      >
                        <Check className="w-3.5 h-3.5" style={{ color: NAVY_DEEP }} strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: NAVY }}>{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Itinerary */}
            {Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0 && (
              <SectionCard testid="trip-itinerary">
                <SectionHeading eyebrow="Programa completo" title="Itinerario día por día" />
                <div className="space-y-4">
                  {pkg.itinerary.map((day, i) => (
                    <div key={`day-${i}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-11 h-11 rounded-full font-black text-sm flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                            color: NAVY_DEEP,
                            boxShadow: `0 6px 18px -4px rgba(212,175,90,0.5)`,
                            fontFamily: SERIF,
                          }}
                        >
                          {day?.day || i + 1}
                        </div>
                        {i < pkg.itinerary.length - 1 && (
                          <div className="w-px flex-1 mt-2" style={{ background: `linear-gradient(180deg, ${GOLD}77, transparent)` }} />
                        )}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: `${GOLD}cc` }}>
                          Día {day?.day || i + 1}
                        </p>
                        <h3 className="font-heading font-bold text-base mb-1" style={{ color: NAVY, fontFamily: SERIF }}>
                          {day?.title || `Día ${day?.day || i + 1}`}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: `${NAVY}99` }}>{day?.description || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar - Pricing & CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-36 space-y-4">
              {/* Price Card — luxury dark */}
              <div
                className="relative rounded-[22px] p-6 overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
                  border: `1px solid ${GOLD}66`,
                  boxShadow: `0 25px 60px -20px rgba(13,43,69,0.55)`,
                }}
                data-testid="trip-price-card"
              >
                {/* Gold radial + hairlines */}
                <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 85% 15%, ${GOLD} 0, transparent 50%)` }} />
                <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                <div className="absolute bottom-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />

                <div className="relative mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-2" style={{ color: `${GOLD}cc` }}>Desde</p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="text-4xl sm:text-5xl font-black tracking-tight"
                      style={{
                        background: `linear-gradient(92deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        fontFamily: SERIF,
                      }}
                    >
                      Q.{fmtPrice(pkg.price)}
                    </span>
                    <span className="text-sm italic" style={{ color: `${CHAMPAGNE}99`, fontFamily: SERIF }}>por persona</span>
                  </div>
                  {memberPrice > 0 && (
                    <div
                      className="mt-3 flex items-center justify-between p-3 rounded-xl"
                      style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}66` }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: CHAMPAGNE }}>Precio socio</span>
                      <span className="text-base font-black" style={{ color: '#F5E6B8', fontFamily: SERIF }}>Q.{fmtPrice(memberPrice)}</span>
                    </div>
                  )}
                  <p className="text-[11px] italic leading-relaxed mt-4" style={{ color: `${CHAMPAGNE}77`, fontFamily: SERIF }} data-testid="price-disclaimer">
                    Precios referenciales — pueden variar según fechas, temporada y disponibilidad. No incluyen vuelos, impuestos ni extras.
                  </p>
                </div>

                {pkg.promo_end && (
                  <div className="relative mb-4 pt-4 border-t" style={{ borderColor: `${GOLD}33` }}>
                    <CountdownTimer endDate={pkg.promo_end} label="Promoción termina en" />
                  </div>
                )}

                <div className="relative space-y-0 mb-5 text-sm">
                  {[
                    { icon: Calendar, label: 'Duración', value: `${pkg.duration_days} días` },
                    { icon: MapPin, label: 'Destino', value: pkg.country },
                    ...(pkg.accommodation_type ? [{ icon: Hotel, label: 'Alojamiento', value: pkg.accommodation_type }] : []),
                    ...(pkg.max_group ? [{ icon: Users, label: 'Grupo', value: `${pkg.min_group || 1}-${pkg.max_group} personas` }] : []),
                  ].map((row, i, arr) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid ${GOLD}22` : 'none' }}
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: `${CHAMPAGNE}aa` }}>
                        <row.icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
                        {row.label}
                      </span>
                      <span className="font-semibold capitalize" style={{ color: CHAMPAGNE }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setShowQuoteForm(true)}
                  className="relative w-full h-13 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                    color: NAVY_DEEP,
                    border: `1px solid ${GOLD}`,
                    boxShadow: `0 15px 40px -10px rgba(212,175,90,0.55)`,
                  }}
                  data-testid="request-quote-btn"
                >
                  Solicitar cotización
                </Button>
                <p className="text-[10px] text-center mt-3 italic" style={{ color: `${CHAMPAGNE}88`, fontFamily: SERIF }}>
                  Sin compromiso — respuesta en menos de 24 horas
                </p>
              </div>

              {/* Trust signals — cream card */}
              <SectionCard>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: '#8B6F2E' }}>Garantía Kuxtal</p>
                <div className="space-y-2.5 text-sm">
                  {[
                    'Asesoría personalizada',
                    'Precios exclusivos para socios',
                    'Pago en cuotas disponible',
                    'Garantía de mejor precio',
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)` }}
                      >
                        <Check className="w-3 h-3" style={{ color: NAVY_DEEP }} strokeWidth={3} />
                      </div>
                      <span style={{ color: `${NAVY}cc` }}>{t}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Modal — luxury styled */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: `${NAVY_DEEP}cc`, backdropFilter: 'blur(8px)' }} data-testid="quote-modal">
          <div
            className="relative rounded-[22px] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#FFFFFF', boxShadow: `0 40px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px ${GOLD}44` }}
          >
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: '#8B6F2E' }}>Solicitud privada</p>
            </div>
            <h3 className="font-heading text-2xl font-black mb-1" style={{ color: NAVY, fontFamily: SERIF }}>Solicitar Cotización</h3>
            <p className="text-sm italic mb-3" style={{ color: `${NAVY}99`, fontFamily: SERIF }}>Para: {pkg.title}</p>

            {isLoggedMember && (
              <div
                className="rounded-xl p-3 mb-4 flex items-start gap-2 text-xs"
                style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}55`, color: NAVY }}
                data-testid="quote-member-banner"
              >
                <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
                <span>
                  Estás cotizando como socio <strong>#{linkedMember.contract_number}</strong>. La cotización quedará guardada en tu portal en la pestaña <strong>Cotizaciones</strong>.
                </span>
              </div>
            )}

            <form onSubmit={submitQuote} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>Nombre completo</label>
                <input value={quoteForm.name} onChange={e => setQuoteForm({ ...quoteForm, name: e.target.value })} required readOnly={isLoggedMember} className={`w-full mt-1 h-10 rounded-xl px-3 text-sm focus:outline-none transition-all ${isLoggedMember ? 'cursor-not-allowed' : ''}`} style={{ border: `1px solid ${GOLD}44`, background: isLoggedMember ? '#F3EEE2' : '#FAF8F3' }} data-testid="quote-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>Email</label>
                  <input type="email" value={quoteForm.email} onChange={e => setQuoteForm({ ...quoteForm, email: e.target.value })} required readOnly={isLoggedMember} className={`w-full mt-1 h-10 rounded-xl px-3 text-sm focus:outline-none ${isLoggedMember ? 'cursor-not-allowed' : ''}`} style={{ border: `1px solid ${GOLD}44`, background: isLoggedMember ? '#F3EEE2' : '#FAF8F3' }} data-testid="quote-email" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>Teléfono</label>
                  <input value={quoteForm.phone} onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })} required readOnly={isLoggedMember} className={`w-full mt-1 h-10 rounded-xl px-3 text-sm focus:outline-none ${isLoggedMember ? 'cursor-not-allowed' : ''}`} style={{ border: `1px solid ${GOLD}44`, background: isLoggedMember ? '#F3EEE2' : '#FAF8F3' }} data-testid="quote-phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>No. Contrato</label>
                  <input value={quoteForm.contract_number} onChange={e => setQuoteForm({ ...quoteForm, contract_number: e.target.value })} placeholder={isLoggedMember ? '' : 'Opcional'} readOnly={isLoggedMember} className={`w-full mt-1 h-10 rounded-xl px-3 text-sm focus:outline-none ${isLoggedMember ? 'cursor-not-allowed' : ''}`} style={{ border: `1px solid ${GOLD}44`, background: isLoggedMember ? '#F3EEE2' : '#FAF8F3' }} data-testid="quote-contract" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>Viajeros</label>
                  <input type="number" min="1" value={quoteForm.guests} onChange={e => setQuoteForm({ ...quoteForm, guests: parseInt(e.target.value) })} className="w-full mt-1 h-10 rounded-xl px-3 text-sm focus:outline-none" style={{ border: `1px solid ${GOLD}44`, background: '#FAF8F3' }} data-testid="quote-guests" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>Fecha de viaje deseada</label>
                <input type="date" value={quoteForm.travel_date} onChange={e => setQuoteForm({ ...quoteForm, travel_date: e.target.value })} className="w-full mt-1 h-10 rounded-xl px-3 text-sm focus:outline-none" style={{ border: `1px solid ${GOLD}44`, background: '#FAF8F3' }} data-testid="quote-travel-date" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}88` }}>Mensaje (opcional)</label>
                <textarea value={quoteForm.message} onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })} rows={3} placeholder="Fechas alternativas, requisitos especiales..." className="w-full mt-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none" style={{ border: `1px solid ${GOLD}44`, background: '#FAF8F3' }} data-testid="quote-message" />
              </div>
              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowQuoteForm(false)} className="flex-1 rounded-xl font-bold uppercase tracking-[0.15em] text-xs" style={{ borderColor: `${GOLD}77`, color: NAVY, background: 'transparent' }}>Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl font-bold uppercase tracking-[0.15em] text-xs" style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`, color: NAVY_DEEP, border: `1px solid ${GOLD}` }} data-testid="quote-submit-btn">Enviar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
