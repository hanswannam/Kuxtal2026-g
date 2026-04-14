import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Gift, CheckCircle2, ArrowRight, Plane } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";

export default function ReferralPage() {
  const { code } = useParams();
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/referral/${code}`).then(r => { setReferralInfo(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/referral/${code}/submit`, form);
      setSubmitted(true);
      toast.success('Solicitud enviada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al enviar');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!referralInfo || !referralInfo.valid) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <img src={LOGO_URL} alt="Kuxtal Travel" className="h-16 w-auto mb-6" />
        <h2 className="font-heading text-2xl font-bold mb-2">Código inválido</h2>
        <p className="text-muted-foreground mb-6">Este enlace de referido no es válido</p>
        <Link to="/"><Button className="rounded-full">Ir al inicio</Button></Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" data-testid="referral-success">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Solicitud Enviada</h2>
          <p className="text-muted-foreground mb-6">Gracias por tu interés. Nuestro equipo se pondrá en contacto contigo pronto.</p>
          <Link to="/search"><Button className="rounded-full bg-primary hover:bg-primary/90">Explorar Destinos</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="referral-page">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Kuxtal Travel" className="h-14 w-auto mx-auto mb-6" />
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full mb-4">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Invitación Especial</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-3">
            ¡Has sido invitado!
          </h1>
          <p className="text-muted-foreground">
            <strong>{referralInfo.referrer_name}</strong> te invita a conocer los beneficios exclusivos del Club Vacacional Kuxtal Travel
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border" data-testid="referral-form">
          <h2 className="font-heading text-lg font-semibold mb-4">Déjanos tus datos</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-xl mt-1" data-testid="ref-name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="rounded-xl mt-1" data-testid="ref-email" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="rounded-xl mt-1" data-testid="ref-phone" />
            </div>
            <div>
              <Label>Mensaje (opcional)</Label>
              <Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="¿Qué destinos te interesan?" className="rounded-xl mt-1" data-testid="ref-message" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold" data-testid="ref-submit">
              {submitting ? 'Enviando...' : 'Enviar Solicitud'} {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/search" className="text-primary hover:underline">Explorar destinos</Link> · <Link to="/" className="text-primary hover:underline">Ir al inicio</Link>
        </p>
      </div>
    </div>
  );
}
