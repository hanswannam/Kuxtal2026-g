import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Star, MapPin, Calendar, Check, ArrowLeft, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function TripDetailPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', contract_number: '', message: '', guests: 1 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/packages/${id}`).then(r => { setPkg(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/quotations`, { ...form, package_id: id });
      toast.success('Solicitud de cotización enviada correctamente');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', contract_number: '', message: '', guests: 1 });
    } catch (err) {
      toast.error('Error al enviar la solicitud');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <h2 className="font-heading text-2xl font-bold mb-4">Paquete no encontrado</h2>
        <Link to="/search"><Button className="rounded-full">Volver a destinos</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16" data-testid="trip-detail-page">
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[350px]">
        <img
          src={pkg.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}
          alt={pkg.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <Link to="/search" className="inline-flex items-center gap-1 text-white/80 text-sm mb-4 hover:text-white transition-colors" data-testid="back-to-search">
              <ArrowLeft className="w-4 h-4" /> Volver a destinos
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-semibold">
                {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
              </span>
              <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-white text-xs font-medium">{pkg.rating}</span>
              </div>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white font-bold tracking-tight">
              {pkg.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{pkg.duration_days} días</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{pkg.country}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-4">Descripción</h2>
              <p className="text-foreground/80 leading-relaxed">{pkg.description}</p>
            </div>

            {/* Includes */}
            {pkg.includes && pkg.includes.length > 0 && (
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-4">Incluye</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl">
                      <div className="p-1 bg-primary/10 rounded-lg">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Pricing & CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-border rounded-2xl p-6 shadow-sm" data-testid="trip-pricing-card">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Desde</p>
                <p className="font-heading text-3xl font-bold text-primary">Q.{pkg.price?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Por persona, habitación doble</p>
              </div>

              {pkg.member_price > 0 && (
                <div className="p-3 bg-accent rounded-xl mb-4">
                  <p className="text-xs text-primary font-semibold mb-1">Precio Socio Club</p>
                  <p className="font-heading text-xl font-bold text-primary">Q.{pkg.member_price?.toLocaleString()}</p>
                </div>
              )}

              <Button
                onClick={() => { setShowForm(true); setIsMember(false); }}
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-base font-semibold transition-all hover:-translate-y-0.5 mb-3"
                data-testid="quote-btn"
              >
                <Send className="w-4 h-4 mr-2" /> Cotizar
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowForm(true); setIsMember(true); }}
                className="w-full rounded-xl h-12 text-sm"
                data-testid="member-quote-btn"
              >
                Soy Socio - Cotizar con Descuento
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="quote-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-1">
              {isMember ? 'Cotización para Socios' : 'Solicitar Cotización'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">{pkg.title}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isMember ? (
                <div>
                  <Label>Número de Contrato</Label>
                  <Input
                    value={form.contract_number}
                    onChange={e => setForm({...form, contract_number: e.target.value})}
                    placeholder="Ej: KT-001"
                    required
                    className="rounded-xl mt-1"
                    data-testid="quote-contract-input"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Nombre completo</Label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-xl mt-1" data-testid="quote-name-input" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="rounded-xl mt-1" data-testid="quote-email-input" />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="rounded-xl mt-1" data-testid="quote-phone-input" />
                  </div>
                </>
              )}
              <div>
                <Label>Huéspedes</Label>
                <Input type="number" min="1" value={form.guests} onChange={e => setForm({...form, guests: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="quote-guests-input" />
              </div>
              <div>
                <Label>Mensaje (opcional)</Label>
                <Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Cuéntanos sobre tu viaje ideal..." className="rounded-xl mt-1" data-testid="quote-message-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl" data-testid="quote-cancel-btn">Cancelar</Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="quote-submit-btn">
                  {submitting ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
