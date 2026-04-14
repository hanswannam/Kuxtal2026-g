import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, MapPin, Star, Calendar, Users, ArrowRight, Shield, Heart, Globe, Store, Gift, Plane } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";

export default function HomePage() {
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/packages?featured=true`).then(r => setPackages(r.data.slice(0, 6))).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/6875499/pexels-photo-6875499.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Tropical beach resort"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl animate-fade-in-up">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-body font-semibold mb-4">
              Club Vacacional Premium
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tighter leading-tight mb-6">
              Viajes diseñados a tu medida
            </h1>
            <p className="text-lg text-white/80 font-body mb-8 max-w-lg leading-relaxed">
              Experiencias inolvidables en los destinos más exclusivos del mundo. Descubre el privilegio de viajar con Kuxtal Travel.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg" data-testid="hero-search-form">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar destino, país..."
                  className="pl-12 h-14 rounded-full bg-white/95 border-0 text-foreground placeholder:text-muted-foreground shadow-lg focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="hero-search-input"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                data-testid="hero-search-btn"
              >
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Seguridad Total', desc: 'Viaja con la tranquilidad de estar respaldado por expertos' },
              { icon: Heart, title: 'Experiencias Únicas', desc: 'Actividades exclusivas diseñadas para crear recuerdos' },
              { icon: Globe, title: 'Destinos Premium', desc: 'Acceso a los mejores destinos en Latinoamérica y el mundo' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl hover:bg-secondary/50 transition-colors duration-300" data-testid={`value-prop-${i}`}>
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
                className="trip-card group bg-white rounded-2xl overflow-hidden border border-border opacity-0 animate-fade-in-up"
                data-testid={`trip-card-${i}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pkg.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium">{pkg.rating}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {pkg.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {pkg.duration_days} días
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {pkg.country}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Desde</p>
                      <p className="text-xl font-bold text-primary">Q.{pkg.price?.toLocaleString()}</p>
                    </div>
                    <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 transition-all hover:-translate-y-0.5" data-testid={`trip-card-${i}-btn`}>
                      Ver Viaje
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="sm:hidden text-center mt-8">
            <Link to="/search">
              <Button variant="outline" className="rounded-full">Ver todos los destinos</Button>
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
              alt="Vacation experience"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
              <div className="px-8 sm:px-12 lg:px-16 max-w-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60 font-semibold mb-3">Únete al Club</p>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-tight mb-4">
                  Transforma tus sueños en aventuras
                </h2>
                <p className="text-white/70 mb-6 text-sm leading-relaxed">
                  Como socio de Kuxtal Travel obtén precios exclusivos, acceso a promociones y beneficios en comercios aliados.
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

      {/* Benefits / Commerce Section */}
      <section className="py-20 bg-white" data-testid="benefits-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Beneficios Exclusivos</p>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Descuentos en Comercios Aliados
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Como socio, accede a descuentos y promociones especiales en restaurantes, spas, gimnasios y más
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { icon: '🍽️', label: 'Restaurantes' },
              { icon: '💆', label: 'Belleza' },
              { icon: '🏋️', label: 'Deportes' },
              { icon: '🐾', label: 'Mascotas' },
              { icon: '🏥', label: 'Hospitales' },
              { icon: '🎭', label: 'Entretenimiento' },
            ].map((cat, i) => (
              <Link
                key={i}
                to={`/benefits?category=${cat.label}`}
                className="flex flex-col items-center p-4 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all group"
                data-testid={`benefit-cat-${i}`}
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{cat.label}</span>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link to="/benefits">
              <Button className="rounded-full bg-primary hover:bg-primary/90 transition-all hover:-translate-y-0.5" data-testid="view-benefits-btn">
                <Store className="w-4 h-4 mr-2" /> Ver Todos los Comercios
              </Button>
            </Link>
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
                "Kuxtal" significa "vida" en maya. Transformamos sueños en aventuras inolvidables.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Enlaces</h4>
              <div className="space-y-2 text-sm text-white/60">
                <Link to="/search" className="block hover:text-white transition-colors">Destinos</Link>
                <Link to="/search?category=experiencia" className="block hover:text-white transition-colors">Experiencias</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Acceso Socios</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Contacto</h4>
              <div className="space-y-2 text-sm text-white/60">
                <p>Guatemala, Centro América</p>
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
