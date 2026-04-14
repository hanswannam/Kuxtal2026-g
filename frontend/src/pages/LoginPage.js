import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plane, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { loginAdmin, loginMember } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('member');
  const [loading, setLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ contract_number: '', dpi: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  const handleMemberLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginMember(memberForm.contract_number, memberForm.dpi);
      toast.success('Bienvenido al portal de socios');
      navigate('/member');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginAdmin(adminForm.email, adminForm.password);
      toast.success('Bienvenido');
      navigate(data.role === 'member' ? '/member' : '/admin');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Credenciales inválidas');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.pexels.com/photos/6875529/pexels-photo-6875529.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Luxury villas"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-sm">
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-6 h-6 text-white" />
            <span className="font-heading text-xl font-bold text-white">Kuxtal Travel</span>
          </div>
          <h2 className="font-heading text-2xl text-white font-bold mb-2">Tu aventura comienza aquí</h2>
          <p className="text-white/70 text-sm">Accede a tu portal y descubre beneficios exclusivos como socio del club.</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Plane className="w-6 h-6 text-primary" />
            <span className="font-heading text-xl font-bold">Kuxtal Travel</span>
          </Link>

          <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Iniciar Sesión</h1>
          <p className="text-muted-foreground text-sm mb-8">Accede a tu cuenta para ver tus beneficios</p>

          {/* Toggle */}
          <div className="flex bg-secondary rounded-xl p-1 mb-8" data-testid="login-mode-toggle">
            <button
              onClick={() => setMode('member')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'member' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              data-testid="login-mode-member"
            >
              Socio
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              data-testid="login-mode-admin"
            >
              Administrador
            </button>
          </div>

          {mode === 'member' ? (
            <form onSubmit={handleMemberLogin} className="space-y-5" data-testid="member-login-form">
              <div>
                <Label className="text-sm font-medium">Número de Contrato</Label>
                <Input
                  value={memberForm.contract_number}
                  onChange={e => setMemberForm({...memberForm, contract_number: e.target.value})}
                  placeholder="Ej: KT-001"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                  data-testid="member-contract-input"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">DPI</Label>
                <Input
                  type="password"
                  value={memberForm.dpi}
                  onChange={e => setMemberForm({...memberForm, dpi: e.target.value})}
                  placeholder="Ingresa tu DPI"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                  data-testid="member-dpi-input"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold transition-all hover:-translate-y-0.5" data-testid="member-login-btn">
                {loading ? 'Ingresando...' : 'Ingresar'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-5" data-testid="admin-login-form">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={adminForm.email}
                  onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                  placeholder="admin@kuxtaltravels.com"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                  data-testid="admin-email-input"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Contraseña</Label>
                <Input
                  type="password"
                  value={adminForm.password}
                  onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                  placeholder="Tu contraseña"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                  data-testid="admin-password-input"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold transition-all hover:-translate-y-0.5" data-testid="admin-login-btn">
                {loading ? 'Ingresando...' : 'Ingresar'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8">
            ¿No eres socio?{' '}
            <Link to="/search" className="text-primary hover:underline font-medium">Explora nuestros destinos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
