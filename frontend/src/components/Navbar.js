import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Menu, X, User, LogOut, LayoutDashboard, Store } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !scrolled && !mobileOpen;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/search', label: 'Destinos' },
    { to: '/search?category=alojamiento', label: 'Alojamientos' },
    { to: '/search?category=experiencia', label: 'Experiencias' },
    { to: '/search?category=paquete', label: 'Paquetes' },
    { to: '/benefits', label: 'Kuxtal Club' },
  ];

  const getDashboardPath = () => {
    if (!user || !user.role) return '/login';
    if (user.role === 'member') return '/member';
    if (user.role === 'commerce') return '/commerce-portal';
    return '/admin';
  };

  const getDashboardLabel = () => {
    if (!user || !user.role) return 'Acceder';
    if (user.role === 'member') return 'Mi Portal';
    if (user.role === 'commerce') return 'Mi Comercio';
    return 'Admin';
  };

  return (
    <nav
      data-testid="main-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isTransparent ? 'bg-transparent' : 'glass-nav'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <img
              src={LOGO_URL}
              alt="Kuxtal Travel"
              className={`h-10 lg:h-12 w-auto transition-all ${isTransparent ? 'brightness-0 invert' : ''}`}
            />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:bg-primary/10 ${
                  isTransparent ? 'text-white/90 hover:text-white hover:bg-white/15' : 'text-foreground/70 hover:text-primary'
                }`}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user && user.role ? (
              <>
                <Link to={getDashboardPath()}>
                  <Button
                    variant={isTransparent ? 'outline' : 'secondary'}
                    size="sm"
                    className={`rounded-full ${isTransparent ? 'border-white/40 text-white hover:bg-white/15' : ''}`}
                    data-testid="nav-dashboard-btn"
                  >
                    {user.role === 'commerce' ? <Store className="w-4 h-4 mr-2" /> : <LayoutDashboard className="w-4 h-4 mr-2" />}
                    {getDashboardLabel()}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`rounded-full ${isTransparent ? 'text-white/80 hover:text-white hover:bg-white/15' : 'text-muted-foreground'}`}
                  data-testid="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button
                  size="sm"
                  className={`rounded-full transition-all duration-200 hover:-translate-y-0.5 ${
                    isTransparent ? 'bg-white text-foreground hover:bg-white/90' : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                  data-testid="nav-login-btn"
                >
                  <User className="w-4 h-4 mr-2" />
                  Acceder
                </Button>
              </Link>
            )}
          </div>

          <button
            className={`lg:hidden p-2 rounded-lg ${isTransparent ? 'text-white' : 'text-foreground'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="nav-mobile-toggle"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(link => (
              <button key={link.label} onClick={() => { setMobileOpen(false); navigate(link.to); }}
                className="block w-full text-left px-4 py-3 text-sm font-medium rounded-xl hover:bg-secondary transition-colors"
                data-testid={`nav-mobile-${link.label.toLowerCase().replace(/\s/g, '-')}`}>
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border">
              {user && user.role ? (
                <>
                  <Link to={getDashboardPath()} onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl mb-2" data-testid="nav-mobile-dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> {getDashboardLabel()}
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full rounded-xl" onClick={handleLogout} data-testid="nav-mobile-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full rounded-xl" data-testid="nav-mobile-login">
                    <User className="w-4 h-4 mr-2" /> Acceder
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
