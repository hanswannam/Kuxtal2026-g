import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowRight, ArrowLeft, Store, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";
const API = process.env.REACT_APP_BACKEND_URL;

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <code className="text-[11px] font-mono font-medium select-all">{value}</code>
        <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { loginAdmin, loginMember, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('member');
  const [loading, setLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ contract_number: '', dpi: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [commerceForm, setCommerceForm] = useState({ commerce_id: '', code: '' });

  const handleMemberLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await loginMember(memberForm.contract_number, memberForm.dpi); toast.success('Bienvenido al portal de socios'); navigate('/member');
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al iniciar sesión'); }
    setLoading(false);
  };
  const handleAdminLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const data = await loginAdmin(adminForm.email, adminForm.password); toast.success('Bienvenido'); navigate(data.role === 'member' ? '/member' : '/admin');
    } catch (err) { toast.error(err.response?.data?.detail || 'Credenciales inválidas'); }
    setLoading(false);
  };
  const handleCommerceLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const { data } = await axios.post(`${API}/api/auth/commerce-login`, commerceForm, { withCredentials: true }); localStorage.setItem('kuxtal_token', data.token); await checkAuth(); toast.success('Bienvenido al portal de comercio'); navigate('/commerce-portal');
    } catch (err) { toast.error(err.response?.data?.detail || 'Código inválido'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src="https://images.pexels.com/photos/6875529/pexels-photo-6875529.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="Luxury villas" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <img src={LOGO_URL} alt="Kuxtal Travel" className="h-14 w-auto mb-4 brightness-0 invert" />
          <h2 className="font-heading text-2xl text-white font-bold mb-2">Tu aventura comienza aquí</h2>
          <p className="text-white/70 text-sm">Accede a tu portal y descubre beneficios exclusivos como socio del club.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group" data-testid="login-back-home">
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <img src={LOGO_URL} alt="Kuxtal Travel" className="h-10 w-auto" />
          </Link>

          <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Iniciar Sesión</h1>
          <p className="text-muted-foreground text-sm mb-6">Accede a tu cuenta</p>

          <div className="flex bg-secondary rounded-xl p-1 mb-6" data-testid="login-mode-toggle">
            {[{ id: 'member', label: 'Socio' }, { id: 'admin', label: 'Admin' }, { id: 'commerce', label: 'Comercio' }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === m.id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
                data-testid={`login-mode-${m.id}`}>{m.label}</button>
            ))}
          </div>

          {mode === 'member' && (
            <form onSubmit={handleMemberLogin} className="space-y-4" data-testid="member-login-form">
              <div><Label className="text-sm font-medium">Número de Contrato</Label>
                <Input value={memberForm.contract_number} onChange={e => setMemberForm({...memberForm, contract_number: e.target.value})} placeholder="Ej: KT-001" required className="mt-1.5 h-12 rounded-xl" data-testid="member-contract-input" /></div>
              <div><Label className="text-sm font-medium">DPI</Label>
                <Input type="password" value={memberForm.dpi} onChange={e => setMemberForm({...memberForm, dpi: e.target.value})} placeholder="Ingresa tu DPI" required className="mt-1.5 h-12 rounded-xl" data-testid="member-dpi-input" /></div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold" data-testid="member-login-btn">
                {loading ? 'Ingresando...' : 'Ingresar'} {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          )}

          {mode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4" data-testid="admin-login-form">
              <div><Label className="text-sm font-medium">Email</Label>
                <Input type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} placeholder="admin@kuxtaltravels.com" required className="mt-1.5 h-12 rounded-xl" data-testid="admin-email-input" /></div>
              <div><Label className="text-sm font-medium">Contraseña</Label>
                <Input type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} placeholder="Tu contraseña" required className="mt-1.5 h-12 rounded-xl" data-testid="admin-password-input" /></div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold" data-testid="admin-login-btn">
                {loading ? 'Ingresando...' : 'Ingresar'} {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          )}

          {mode === 'commerce' && (
            <form onSubmit={handleCommerceLogin} className="space-y-4" data-testid="commerce-login-form">
              <div><Label className="text-sm font-medium">ID del Comercio</Label>
                <Input value={commerceForm.commerce_id} onChange={e => setCommerceForm({...commerceForm, commerce_id: e.target.value})} placeholder="ID proporcionado por administración" required className="mt-1.5 h-12 rounded-xl" data-testid="commerce-id-input" /></div>
              <div><Label className="text-sm font-medium">Código de Acceso</Label>
                <Input type="password" value={commerceForm.code} onChange={e => setCommerceForm({...commerceForm, code: e.target.value})} placeholder="Código de validación" required className="mt-1.5 h-12 rounded-xl" data-testid="commerce-code-input" /></div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold" data-testid="commerce-login-btn">
                <Store className="w-4 h-4 mr-2" /> {loading ? 'Ingresando...' : 'Acceder al Portal'}
              </Button>
            </form>
          )}

          {/* Test Credentials */}
          <div className="mt-8 pt-6 border-t border-border" data-testid="test-credentials">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Credenciales de prueba</p>
            {mode === 'member' && (
              <div className="space-y-1.5">
                <CopyField label="Contrato" value="KT-001" />
                <CopyField label="DPI" value="1234567890101" />
                <p className="text-[10px] text-muted-foreground mt-2">Familiar: mismo contrato, DPI: 9876543210101</p>
              </div>
            )}
            {mode === 'admin' && (
              <div className="space-y-1.5">
                <CopyField label="Email" value="admin@kuxtaltravels.com" />
                <CopyField label="Pass" value="KuxtalAdmin2024!" />
              </div>
            )}
            {mode === 'commerce' && (
              <div className="space-y-1.5">
                <CopyField label="ID" value="69dd90c4b0e08b1f0a2eb0a8" />
                <CopyField label="Código" value="GAUCHA01" />
                <p className="text-[10px] text-muted-foreground mt-2">La Parrilla Gaucha (Restaurantes)</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿No eres socio? <Link to="/search" className="text-primary hover:underline font-medium">Explora destinos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
