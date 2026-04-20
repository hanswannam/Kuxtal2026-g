import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MapPin, Star, Calendar, Users, Check, Clock, Hotel, Mountain, ArrowLeft, Share2, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'sonner';

export default function TripDetailPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: '', email: '', phone: '', contract_number: '', message: '', guests: 2 });
  const [galleryIndex, setGalleryIndex] = useState(0);
  useDocumentTitle(pkg?.title || 'Detalle del Paquete');

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
      toast.success('Cotizacion enviada correctamente');
      setShowQuoteForm(false);
      setQuoteForm({ name: '', email: '', phone: '', contract_number: '', message: '', guests: 2 });
    } catch { toast.error('Error al enviar cotizacion'); }
  };

  const allImages = pkg ? [pkg.image_url, ...(Array.isArray(pkg.gallery) ? pkg.gallery : [])].filter(Boolean) : [];
  const memberPrice = Number(pkg?.member_price) || 0;
  const fmtPrice = (v) => (Number(v) || 0).toLocaleString();

  if (loading) return (
    <div className="min-h-screen pt-20 bg-secondary/20">
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="aspect-[21/9] bg-muted rounded-2xl mb-8" />
        <div className="h-8 bg-muted rounded w-1/2 mb-4" />
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    </div>
  );

  if (!pkg) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold mb-3">Paquete no encontrado</h2>
        <Link to="/search"><Button className="rounded-full">Volver a buscar</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 bg-secondary/20" data-testid="trip-detail-page">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="back-to-search">
          <ArrowLeft className="w-4 h-4" /> Volver a resultados
        </Link>
      </div>

      {/* Hero / Gallery */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[2.5/1]" data-testid="trip-gallery">
          <img
            src={allImages[galleryIndex] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}
            alt={pkg.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Gallery controls */}
          {allImages.length > 1 && (
            <>
              <button onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors" data-testid="gallery-prev">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors" data-testid="gallery-next">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button key={`dot-${i}`} onClick={() => setGalleryIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}

          {/* Category badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-white/90 backdrop-blur text-foreground rounded-full px-3 py-1">
              {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
            </Badge>
            {pkg.featured && <Badge className="bg-primary text-white rounded-full px-3 py-1">Destacado</Badge>}
          </div>

          {/* Share button */}
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors" onClick={() => {navigator.clipboard.writeText(window.location.href); toast.success('Enlace copiado');}} data-testid="share-btn">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Meta */}
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-primary" data-testid="trip-title">
                {pkg.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent-foreground" />{pkg.country}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{pkg.duration_days} dias</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{pkg.rating}/5</span>
                {pkg.accommodation_type && <span className="flex items-center gap-1.5"><Hotel className="w-4 h-4" />{pkg.accommodation_type}</span>}
                {pkg.difficulty && <span className="flex items-center gap-1.5"><Mountain className="w-4 h-4" />{pkg.difficulty}</span>}
                {pkg.max_group && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{pkg.min_group || 1}-{pkg.max_group} personas</span>}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h2 className="font-heading text-lg font-semibold mb-3 text-primary">Descripcion</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="trip-description">
                {pkg.description}
              </p>
            </div>

            {/* Includes */}
            {Array.isArray(pkg.includes) && pkg.includes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-border" data-testid="trip-includes">
                <h2 className="font-heading text-lg font-semibold mb-4 text-primary">Que Incluye</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.includes.map((item, idx) => (
                    <div key={`inc-${idx}`} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-border" data-testid="trip-itinerary">
                <h2 className="font-heading text-lg font-semibold mb-4 text-primary">Itinerario Dia por Dia</h2>
                <div className="space-y-4">
                  {pkg.itinerary.map((day, i) => (
                    <div key={`day-${i}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 text-white bg-primary">
                          {day?.day || i + 1}
                        </div>
                        {i < pkg.itinerary.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                      </div>
                      <div className="pb-6">
                        <h3 className="font-semibold text-sm mb-1">{day?.title || `Dia ${day?.day || i + 1}`}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{day?.description || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Pricing & CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-36 space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-2xl p-6 border border-border shadow-lg" data-testid="trip-price-card">
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Desde</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">Q.{fmtPrice(pkg.price)}</span>
                    <span className="text-sm text-muted-foreground">por persona</span>
                  </div>
                  {memberPrice > 0 && (
                    <div className="mt-2 p-2 rounded-lg border bg-accent/10 border-accent/20">
                      <p className="text-xs font-semibold text-accent-foreground">Precio Socio: Q.{fmtPrice(memberPrice)}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed mt-3" data-testid="price-disclaimer">
                    Los precios pueden variar según fechas, temporada y disponibilidad. Contáctanos para recibir una cotización actualizada.
                  </p>
                </div>

                <div className="space-y-3 mb-5 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Duracion</span>
                    <span className="font-medium">{pkg.duration_days} dias</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Destino</span>
                    <span className="font-medium">{pkg.country}</span>
                  </div>
                  {pkg.accommodation_type && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground flex items-center gap-2"><Hotel className="w-3.5 h-3.5" /> Alojamiento</span>
                      <span className="font-medium capitalize">{pkg.accommodation_type}</span>
                    </div>
                  )}
                  {pkg.max_group && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Grupo</span>
                      <span className="font-medium">{pkg.min_group || 1}-{pkg.max_group} personas</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  data-testid="request-quote-btn"
                >
                  Solicitar Cotizacion
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-3">Sin compromiso. Te respondemos en menos de 24 horas.</p>
              </div>

              {/* Trust signals */}
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-foreground" /><span>Asesoria personalizada</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-foreground" /><span>Precios exclusivos para socios</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-foreground" /><span>Pago en cuotas disponible</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-foreground" /><span>Garantia de mejor precio</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="quote-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-1">Solicitar Cotizacion</h3>
            <p className="text-sm text-muted-foreground mb-5">Para: {pkg.title}</p>
            <form onSubmit={submitQuote} className="space-y-3">
              <div>
                <label className="text-xs font-medium">Nombre completo</label>
                <input value={quoteForm.name} onChange={e => setQuoteForm({...quoteForm, name: e.target.value})} required className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="quote-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input type="email" value={quoteForm.email} onChange={e => setQuoteForm({...quoteForm, email: e.target.value})} required className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="quote-email" />
                </div>
                <div>
                  <label className="text-xs font-medium">Telefono</label>
                  <input value={quoteForm.phone} onChange={e => setQuoteForm({...quoteForm, phone: e.target.value})} required className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="quote-phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">No. Contrato (socio)</label>
                  <input value={quoteForm.contract_number} onChange={e => setQuoteForm({...quoteForm, contract_number: e.target.value})} placeholder="Opcional" className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="quote-contract" />
                </div>
                <div>
                  <label className="text-xs font-medium">Viajeros</label>
                  <input type="number" min="1" value={quoteForm.guests} onChange={e => setQuoteForm({...quoteForm, guests: parseInt(e.target.value)})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="quote-guests" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Mensaje (opcional)</label>
                <textarea value={quoteForm.message} onChange={e => setQuoteForm({...quoteForm, message: e.target.value})} rows={3} placeholder="Fechas preferidas, requisitos especiales..." className="w-full mt-1 rounded-xl border border-input px-3 py-2 text-sm resize-none" data-testid="quote-message" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowQuoteForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white" data-testid="quote-submit-btn">Enviar Cotizacion</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
