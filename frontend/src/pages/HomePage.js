import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, MapPin, Star, Calendar, Users, ArrowRight, Shield, Heart, Globe, Store, Gift, Plane, Hotel, Compass, Package, ChevronDown } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";

const SEARCH_TABS = [
  { id: 'paquete', label: 'Paquetes', icon: Package, placeholder: 'Cancun, Riviera Maya...' },
  { id: 'alojamiento', label: 'Alojamientos', icon: Hotel, placeholder: 'Hotel, Resort, Villa...' },
  { id: 'experiencia', label: 'Experiencias', icon: Compass, placeholder: 'Tours, Aventuras...' },
];

export default function HomePage() {
  const [packages, setPackages] = useState([]);
  const [searchTab, setSearchTab] = useState('paquete');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [guests, setGuests] = useState('2');
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();
  useDocumentTitle(null);

  useEffect(() => {
    axios.get(`${API}/api/packages?featured=true`).then(r => setPackages(r.data.slice(0, 6))).catch(() => {});
    axios.get(`${API}/api/countries`).then(r => setCountries(r.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('q', destination);
    if (searchTab) params.set('category', searchTab);
    navigate(`/search?${params.toString()}`);
  };

  const currentTab = SEARCH_TABS.find(t => t.id === searchTab) || SEARCH_TABS[0];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1770185998570-db739db7af47?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1920"
            alt="Resort tropical aereo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-16">
          {/* Title */}
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tighter leading-tight mb-4">
              Tu destino perfecto te espera
            </h1>
            <p className="text-base sm:text-lg text-white/80 font-body max-w-2xl mx-auto leading-relaxed">
              Paquetes exclusivos, alojamientos premium y experiencias unicas en los mejores destinos del mundo.
            </p>
          </div>

          {/* Search Box - Expedia Style */}
          <div className="max-w-4xl mx-auto" data-testid="hero-search-box">
            {/* Tabs */}
            <div className="flex gap-1 mb-0" data-testid="search-tabs">
              {SEARCH_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSearchTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all ${
                    searchTab === tab.id
                      ? 'bg-white text-foreground shadow-sm'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  }`}
                  data-testid={`search-tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl rounded-tl-none shadow-2xl p-3 sm:p-4" data-testid="hero-search-form">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Destination */}
                <div className="flex-[2] relative">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-0.5 block">Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder={currentTab.placeholder}
                      className="pl-10 h-12 rounded-xl border-border bg-secondary/30 focus:bg-white"
                      data-testid="hero-search-input"
                      list="country-suggestions"
                    />
                    <datalist id="country-suggestions">
                      {countries.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-0.5 block">Fecha</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dates}
                      onChange={e => setDates(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border bg-secondary/30 focus:bg-white"
                      data-testid="hero-search-date"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="flex-1 sm:max-w-[140px]">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-0.5 block">Viajeros</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={guests}
                      onChange={e => setGuests(e.target.value)}
                      className="w-full pl-10 h-12 rounded-xl border border-border bg-secondary/30 focus:bg-white text-sm appearance-none cursor-pointer"
                      data-testid="hero-search-guests"
                    >
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'viajero' : 'viajeros'}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg transition-all hover:-translate-y-0.5 w-full sm:w-auto text-base font-semibold"
                    data-testid="hero-search-btn"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 sm:gap-12 mt-8 text-white/80 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{packages.length > 0 ? '50+' : '---'}</p>
              <p className="text-xs">Destinos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4.8</p>
              <p className="text-xs">Calificacion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">1000+</p>
              <p className="text-xs">Viajeros</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations - Quick Access */}
      {countries.length > 0 && (
        <section className="py-10 bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Destinos populares:</span>
              {countries.slice(0, 8).map(c => (
                <Link
                  key={c}
                  to={`/search?country=${encodeURIComponent(c)}`}
                  className="px-4 py-2 bg-secondary/60 hover:bg-primary/10 hover:text-primary rounded-full text-sm font-medium whitespace-nowrap transition-all border border-transparent hover:border-primary/20"
                  data-testid={`popular-dest-${c}`}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />{c}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Seguridad Total', desc: 'Viaja con la tranquilidad de estar respaldado por expertos en viajes' },
              { icon: Heart, title: 'Experiencias Unicas', desc: 'Actividades exclusivas disenadas para crear recuerdos inolvidables' },
              { icon: Globe, title: 'Destinos Premium', desc: 'Acceso a los mejores destinos en Latinoamerica y el mundo' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-6 rounded-2xl hover:bg-secondary/50 transition-colors duration-300" data-testid={`value-prop-${item.title}`}>
                <div className="p-3 rounded-xl bg-accent">
                  <item.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 bg-secondary/30" data-testid="featured-packages">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Descubre</p>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Destinos Destacados
              </h2>
            </div>
            <Link to="/search" className="hidden sm:flex items-center gap-2 text-primary text-sm font-medium hover:gap-3 transition-all" data-testid="view-all-link">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {packages.map((pkg, i) => (
              <Link
                key={pkg._id}
                to={`/trip/${pkg._id}`}
                className="trip-card group bg-white rounded-2xl overflow-hidden border border-border opacity-0 animate-fade-in-up hover:shadow-xl transition-shadow duration-300"
                data-testid={`trip-card-${i}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pkg.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-foreground">
                      {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
                    </span>
                  </div>
                  {pkg.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-semibold">
                        Destacado
                      </span>
                    </div>
                  )}
                  {/* Price overlay */}
                  <div className="absolute bottom-3 right-3">
                    <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white rounded-lg text-sm font-bold">
                      Q.{pkg.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{pkg.rating}</span>
                      <span className="text-xs text-muted-foreground">/5</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{pkg.duration_days} dias</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{pkg.short_description || pkg.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{pkg.country}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/search">
              <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-8" data-testid="view-all-packages-btn">
                Ver Todos los Destinos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1626970356891-a6339d8eece6?w=1200"
              alt="Experiencia vacacional"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
              <div className="px-8 sm:px-12 lg:px-16 max-w-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60 font-semibold mb-3">Unete al Club</p>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-tight mb-4">
                  Transforma tus suenos en aventuras
                </h2>
                <p className="text-white/70 mb-6 text-sm leading-relaxed">
                  Como socio de Kuxtal Travel obten precios exclusivos, acceso a promociones y beneficios en comercios aliados.
                </p>
                <div className="flex gap-3">
                  <Link to="/search">
                    <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 transition-all hover:-translate-y-0.5" data-testid="cta-explore-btn">
                      <Plane className="w-4 h-4 mr-2" /> Explorar Destinos
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="rounded-full border-white/40 text-white hover:bg-white/15" data-testid="cta-login-btn">
                      Acceso Socios
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ KUXTAL CLUB - Benefits Section ══════ */}
      <section className="py-0 bg-[#0a0f1a]" data-testid="kuxtal-club-section">
        {/* Hero Banner */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#1a0a0a]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src="https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png"
                    alt="Kuxtal Club"
                    className="h-20 sm:h-24 w-auto"
                    data-testid="kuxtal-club-logo"
                  />
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
                  Tu tarjeta de<br />
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    beneficios exclusivos
                  </span>
                </h2>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                  Como socio de Kuxtal Club accede a descuentos y promociones especiales en los mejores comercios aliados de Guatemala.
                </p>

                {/* Stats Row */}
                <div className="flex gap-8 mb-8">
                  <div>
                    <p className="text-3xl font-bold text-white">150+</p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Comercios</p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <p className="text-3xl font-bold text-white">12</p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Categorias</p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">50%</p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Hasta descuento</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link to="/benefits">
                    <Button size="lg" className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 px-8" data-testid="kuxtal-club-explore-btn">
                      <Store className="w-5 h-5 mr-2" /> Explorar Beneficios
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 font-semibold" data-testid="kuxtal-club-login-btn">
                      Acceso Socios
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right - Category Grid */}
              <div className="grid grid-cols-3 gap-3" data-testid="kuxtal-club-categories">
                {[
                  { icon: Store, label: 'Restaurantes', desc: 'Gastronomia', color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400', border: 'border-orange-500/20' },
                  { icon: Heart, label: 'Belleza', desc: 'Spa & Estetica', color: 'from-pink-500/20 to-pink-600/10', iconColor: 'text-pink-400', border: 'border-pink-500/20' },
                  { icon: Shield, label: 'Deportes', desc: 'Fitness & Gym', color: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { icon: Gift, label: 'Mascotas', desc: 'Veterinarias', color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400', border: 'border-amber-500/20' },
                  { icon: Globe, label: 'Salud', desc: 'Hospitales', color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
                  { icon: Star, label: 'Diversion', desc: 'Entretenimiento', color: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400', border: 'border-violet-500/20' },
                ].map((cat) => (
                  <Link
                    key={cat.label}
                    to={`/benefits?category=${cat.label}`}
                    className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${cat.color} border ${cat.border} backdrop-blur-sm hover:scale-[1.03] transition-all duration-300`}
                    data-testid={`club-cat-${cat.label}`}
                  >
                    <div className={`${cat.iconColor} mb-3`}>
                      <cat.icon className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <p className="text-white font-semibold text-sm">{cat.label}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{cat.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO_URL} alt="Kuxtal Travel" className="h-10 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                "Kuxtal" significa "vida" en maya. Transformamos suenos en aventuras inolvidables.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Enlaces</h4>
              <div className="space-y-2 text-sm text-white/60">
                <Link to="/search" className="block hover:text-white transition-colors">Destinos</Link>
                <Link to="/search?category=experiencia" className="block hover:text-white transition-colors">Experiencias</Link>
                <Link to="/search?category=alojamiento" className="block hover:text-white transition-colors">Alojamientos</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Acceso Socios</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Contacto</h4>
              <div className="space-y-2 text-sm text-white/60">
                <p>Guatemala, Centro America</p>
                <p>info@kuxtaltravels.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Kuxtal Travel. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
