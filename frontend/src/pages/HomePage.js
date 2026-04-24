import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Search, MapPin, Star, Calendar, Users, ArrowRight, Plane, Hotel, Compass, Package,
  ChevronDown, Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle,
  Tag, Sparkles, Handshake, Crown, Lock, ShieldCheck, ArrowUpRight,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CountdownTimer } from '../components/CountdownTimer';
import ImageWithFallback from '../components/ImageWithFallback';

const API = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/ikgtmopq_logo%20kuxtal.avif";
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png";

// Brand palette per design spec
const NAVY = '#0D2B45';
const LIME = '#8CC63F';

const SEARCH_TABS = [
  { id: 'paquete', label: 'Paquetes', icon: Package, placeholder: 'Cancún, Riviera Maya...' },
  { id: 'alojamiento', label: 'Alojamientos', icon: Hotel, placeholder: 'Hotel, Resort, Villa...' },
  { id: 'experiencia', label: 'Experiencias', icon: Compass, placeholder: 'Tours, Aventuras...' },
];

// Four perks shown in hero strip + in "Disfruta más" grid
const PERKS = [
  { icon: Tag, title: 'Precios Exclusivos', desc: 'Accede a tarifas preferenciales en hoteles, paquetes vacacionales y más.' },
  { icon: Sparkles, title: 'Promociones Especiales', desc: 'Ofertas y descuentos exclusivos solo para miembros, todo el año.' },
  { icon: Plane, title: 'Experiencias Únicas', desc: 'Vive eventos, viajes y experiencias diseñadas especialmente para nuestros socios.' },
  { icon: Handshake, title: 'Beneficios con Aliados', desc: 'Descuentos y ventajas en restaurantes, servicios y comercios de nuestra red.' },
];

// Static partners (logos/names). These are placeholders for the allies row.
const PARTNERS = [
  { name: 'La Estancia', tag: 'Argentina' },
  { name: 'azul', tag: 'restaurante' },
  { name: 'mío', tag: 'café' },
  { name: 'La Cabrera', tag: 'steak house' },
  { name: 'BODYTECH', tag: '' },
];

// Collage images for Kuxtal Club section (2x2)
const CLUB_COLLAGE = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&h=500&fit=crop', // beach
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=700&h=500&fit=crop', // couple
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=700&h=500&fit=crop', // plane
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&h=500&fit=crop', // restaurant
];

// Hero image: infinity pool with palms (luxe resort aerial view)
const HERO_IMG = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&h=1200&fit=crop&q=80';
// Final CTA image: tropical island from above
const CTA_IMG = 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1600&h=900&fit=crop&q=80';

export default function HomePage() {
  const [packages, setPackages] = useState([]);
  const [searchTab, setSearchTab] = useState('paquete');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [guests, setGuests] = useState('2');
  const [countries, setCountries] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const navigate = useNavigate();
  useDocumentTitle(null);

  useEffect(() => {
    axios.get(`${API}/api/config/social-links`).then(r => setSocialLinks(r.data || {})).catch(() => {});
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
    <div className="min-h-screen bg-white" data-testid="home-page">

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[640px] lg:min-h-[760px] flex items-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Resort tropical con piscina infinita" className="w-full h-full object-cover" />
          {/* Left-to-right navy overlay for readability on text side */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${NAVY}f2 0%, ${NAVY}cc 38%, ${NAVY}55 60%, transparent 85%)` }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm text-white/90 text-[10px] font-bold uppercase tracking-[0.22em] mb-6" data-testid="hero-eyebrow">
              <Crown className="w-3 h-3" style={{ color: LIME }} /> Club de viajes exclusivo
            </span>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl text-white font-black tracking-tight leading-[1.02] mb-5" data-testid="hero-title">
              Más que viajes,<br />
              es <span style={{ color: LIME }}>pertenecer.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/75 max-w-lg leading-relaxed mb-9" data-testid="hero-subtitle">
              Accede a experiencias exclusivas, precios especiales y beneficios únicos con Kuxtal&nbsp;Travels.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <Link to="/login">
                <Button
                  size="lg"
                  className="rounded-full h-12 px-7 font-bold text-sm shadow-[0_10px_30px_-6px_rgba(140,198,63,0.55)] hover:shadow-[0_14px_36px_-6px_rgba(140,198,63,0.75)] transition-all hover:-translate-y-0.5"
                  style={{ background: LIME, color: NAVY }}
                  data-testid="hero-join-btn"
                >
                  Hazte miembro <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#kuxtal-club-section">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-7 font-semibold text-sm border-white/40 text-white bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-white/70 transition-all"
                  data-testid="hero-learn-btn"
                >
                  Conoce más
                </Button>
              </a>
            </div>

            {/* Perks mini-strip — 4 icons in a row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-3xl" data-testid="hero-perks">
              {PERKS.map((p) => (
                <div key={p.title} className="flex flex-col items-start text-white/90 group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all group-hover:scale-110" style={{ background: `${LIME}22`, border: `1px solid ${LIME}55` }}>
                    <p.icon className="w-5 h-5" strokeWidth={1.6} style={{ color: LIME }} />
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] leading-tight">{p.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SEARCH BAND (moved below hero) ══════ */}
      <section className="relative bg-white border-b border-slate-100 -mt-10 z-20" data-testid="search-band">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(13,43,69,0.25)] ring-1 ring-slate-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-0.5 px-3 pt-3" data-testid="search-tabs">
              {SEARCH_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSearchTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all ${
                    searchTab === tab.id
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  style={searchTab === tab.id ? { background: NAVY } : {}}
                  data-testid={`search-tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="p-3 sm:p-4 pt-2" data-testid="hero-search-form">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-[2] relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] px-3 mb-0.5 block">Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder={currentTab.placeholder}
                      className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400"
                      data-testid="hero-search-input"
                      list="country-suggestions"
                    />
                    <datalist id="country-suggestions">
                      {countries.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] px-3 mb-0.5 block">Fecha</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={dates}
                      onChange={e => setDates(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400"
                      data-testid="hero-search-date"
                    />
                  </div>
                </div>

                <div className="flex-1 sm:max-w-[150px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] px-3 mb-0.5 block">Viajeros</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={guests}
                      onChange={e => setGuests(e.target.value)}
                      className="w-full pl-10 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm appearance-none cursor-pointer"
                      data-testid="hero-search-guests"
                    >
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'viajero' : 'viajeros'}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="h-12 px-7 rounded-xl font-bold text-white w-full sm:w-auto text-sm transition-all hover:-translate-y-0.5"
                    style={{ background: NAVY }}
                    data-testid="hero-search-btn"
                  >
                    <Search className="w-4 h-4 mr-1.5" /> Buscar
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Popular destinations chips */}
          {countries.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-5 scrollbar-hide">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">Destinos populares:</span>
              {countries.slice(0, 8).map(c => (
                <Link
                  key={c}
                  to={`/search?country=${encodeURIComponent(c)}`}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-full text-xs font-medium whitespace-nowrap transition-all border border-slate-200 hover:border-slate-900"
                  style={{}}
                  data-testid={`popular-dest-${c}`}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />{c}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════ KUXTAL CLUB — Tu membresía, un mundo de beneficios ══════ */}
      <section id="kuxtal-club-section" className="relative py-20 sm:py-24 overflow-hidden" style={{ background: NAVY }} data-testid="kuxtal-club-section">
        {/* Subtle radial lime accents */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${LIME} 0, transparent 40%), radial-gradient(circle at 80% 80%, ${LIME} 0, transparent 40%)` }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: LIME }}>
              Kuxtal Club
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-5">
              Tu membresía,<br />
              un mundo de <span style={{ color: LIME }}>beneficios</span>
            </h2>
            <p className="text-white/65 text-base leading-relaxed mb-8 max-w-lg">
              Somos un club de viajes diseñado para personas que buscan más que un destino. Vive experiencias inolvidables y disfruta beneficios en comercios aliados.
            </p>
            <Link to="/benefits">
              <Button
                size="lg"
                className="rounded-full h-12 px-7 font-bold text-sm text-white transition-all hover:-translate-y-0.5 shadow-[0_10px_30px_-6px_rgba(13,43,69,0.7)]"
                style={{ background: '#08213A', border: `1px solid ${LIME}55` }}
                data-testid="club-see-benefits-btn"
              >
                Ver beneficios <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Right: 2x2 collage with floating membership card */}
          <div className="relative" data-testid="club-collage">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {CLUB_COLLAGE.map((src, i) => (
                <div key={src} className={`relative rounded-2xl overflow-hidden ring-1 ring-white/10 aspect-[4/3] ${i === 0 ? 'translate-y-3' : ''} ${i === 3 ? 'translate-y-3' : ''}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              ))}
            </div>

            {/* Floating membership card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68%] max-w-[340px]" data-testid="membership-card">
              <div className="relative rounded-2xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] ring-1" style={{ background: `linear-gradient(140deg, ${NAVY} 0%, #142f4b 55%, ${NAVY} 100%)`, borderColor: `${LIME}44` }}>
                <div className="flex items-center justify-center mb-3">
                  <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-12 w-auto" />
                </div>
                <div className="text-center pt-2 border-t" style={{ borderColor: `${LIME}33` }}>
                  <p className="text-white font-heading font-bold text-base tracking-tight mt-2">
                    KUXTAL <span style={{ color: LIME }}>CLUB</span>
                  </p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Acceso Exclusivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ DISFRUTA MÁS, PAGANDO MENOS ══════ */}
      <section className="py-20 bg-white" data-testid="perks-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: NAVY }}>
              Disfruta <span style={{ color: LIME }}>más</span>, pagando <span style={{ color: LIME }}>menos</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl p-6 bg-white border border-slate-100 hover:border-slate-200 hover:shadow-[0_20px_40px_-20px_rgba(13,43,69,0.25)] transition-all hover:-translate-y-1 text-center"
                data-testid={`perk-${p.title}`}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110" style={{ background: `${LIME}18`, color: NAVY }}>
                  <p.icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-2" style={{ color: NAVY }}>
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ DESTINOS DESTACADOS ══════ */}
      {packages.length > 0 && (
        <section className="py-20 bg-slate-50" data-testid="featured-packages">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] mb-2" style={{ color: LIME }}>Descubre</p>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: NAVY }}>
                  Destinos Destacados
                </h2>
              </div>
              <Link to="/search" className="hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all hover:gap-3" style={{ color: NAVY }} data-testid="view-all-link">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, i) => (
                <Link
                  key={pkg._id}
                  to={`/trip/${pkg._id}`}
                  className="group bg-white rounded-2xl overflow-hidden ring-1 ring-slate-100 hover:ring-slate-200 hover:shadow-[0_20px_50px_-20px_rgba(13,43,69,0.35)] transition-all hover:-translate-y-1"
                  data-testid={`trip-card-${i}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ImageWithFallback
                      src={pkg.image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-800">
                        {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
                      </span>
                    </div>
                    {pkg.featured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: LIME, color: NAVY }}>
                          Destacado
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-3 py-1.5 backdrop-blur-sm rounded-lg text-sm font-black text-white" style={{ background: `${NAVY}dd` }}>
                        Q.{pkg.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold">{pkg.rating}</span>
                        <span className="text-xs text-slate-400">/5</span>
                      </div>
                      <span className="text-xs text-slate-500">{pkg.duration_days} días</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-1 line-clamp-1" style={{ color: NAVY }}>
                      {pkg.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{pkg.short_description || pkg.description}</p>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5" style={{ color: LIME }} />
                      <span>{pkg.country}</span>
                    </div>
                    {pkg.promo_end && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <CountdownTimer endDate={pkg.promo_end} compact />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/search">
                <Button size="lg" className="rounded-full px-8 text-white font-bold" style={{ background: NAVY }} data-testid="view-all-packages-btn">
                  Ver Todos los Destinos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════ NUESTROS ALIADOS ══════ */}
      <section className="py-14 sm:py-16 relative" style={{ background: NAVY }} data-testid="partners-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-white/90">
              Nuestros <span style={{ color: LIME }}>aliados</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-14">
            {PARTNERS.map(p => (
              <div key={p.name} className="text-center group transition-all hover:opacity-100 opacity-75" data-testid={`partner-${p.name}`}>
                <p className="font-heading text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'serif' }}>{p.name}</p>
                {p.tag && <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mt-0.5">{p.tag}</p>}
              </div>
            ))}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold" style={{ color: LIME }}>Y más aliados<br />especiales</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="relative py-20 overflow-hidden" data-testid="final-cta">
        <div className="absolute inset-0">
          <img src={CTA_IMG} alt="Destino paradisíaco" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${NAVY}f5 0%, ${NAVY}e8 45%, ${NAVY}c8 100%)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-4">
              El mundo es mejor<br />
              cuando eres <span style={{ color: LIME }}>miembro.</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-7 max-w-md">
              Únete a Kuxtal Club y comienza a disfrutar de un mundo de beneficios desde hoy.
            </p>
            <Link to="/login">
              <Button
                size="lg"
                className="rounded-full h-13 px-8 font-bold text-sm shadow-[0_10px_30px_-6px_rgba(140,198,63,0.55)] hover:shadow-[0_14px_36px_-6px_rgba(140,198,63,0.75)] transition-all hover:-translate-y-0.5"
                style={{ background: LIME, color: NAVY }}
                data-testid="final-cta-btn"
              >
                Hazte miembro hoy <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Right side benefits */}
          <div className="space-y-4">
            {[
              { icon: Crown, title: 'Membresía 100% Digital', desc: 'Todo desde nuestra plataforma fácil, rápida y segura.' },
              { icon: Lock, title: 'Acceso Inmediato', desc: 'Comienza a disfrutar tus beneficios desde el primer día.' },
              { icon: ShieldCheck, title: 'Respaldo Kuxtal', desc: 'Más de 10 años conectando socios con experiencias únicas.' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${LIME}22`, border: `1px solid ${LIME}55` }}>
                  <b.icon className="w-6 h-6" style={{ color: LIME }} strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: LIME }}>{b.title}</p>
                  <p className="text-white/70 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="relative bg-white border-t border-slate-100 pt-14 pb-8" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">

            {/* Brand column */}
            <div className="col-span-2">
              <img src={LOGO_URL} alt="Kuxtal Travels" className="h-12 w-auto mb-4" />
              <p className="text-sm leading-relaxed mb-4 max-w-xs" style={{ color: `${NAVY}99` }}>
                Cada destino una historia. "Kuxtal" significa <em>vida</em> en maya.
              </p>
              {(socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.twitter || socialLinks.youtube || socialLinks.linkedin || socialLinks.whatsapp) && (
                <div className="flex gap-2" data-testid="footer-socials">
                  {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="Facebook" data-testid="social-facebook"><Facebook className="w-4 h-4" /></a>}
                  {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="Instagram" data-testid="social-instagram"><Instagram className="w-4 h-4" /></a>}
                  {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="TikTok" data-testid="social-tiktok">TT</a>}
                  {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="X" data-testid="social-twitter"><Twitter className="w-4 h-4" /></a>}
                  {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="YouTube" data-testid="social-youtube"><Youtube className="w-4 h-4" /></a>}
                  {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="LinkedIn" data-testid="social-linkedin"><Linkedin className="w-4 h-4" /></a>}
                  {socialLinks.whatsapp && <a href={socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: `${NAVY}11`, color: NAVY }} aria-label="WhatsApp" data-testid="social-whatsapp"><MessageCircle className="w-4 h-4" /></a>}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-[0.14em] mb-3" style={{ color: NAVY }}>Navegación</h4>
              <div className="space-y-2 text-sm" style={{ color: `${NAVY}99` }}>
                <Link to="/" className="block hover:text-slate-900 transition-colors">Inicio</Link>
                <Link to="/benefits" className="block hover:text-slate-900 transition-colors">Beneficios</Link>
                <Link to="/search" className="block hover:text-slate-900 transition-colors">Viajes</Link>
                <Link to="/partners" className="block hover:text-slate-900 transition-colors">Aliados</Link>
              </div>
            </div>

            {/* Help */}
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-[0.14em] mb-3" style={{ color: NAVY }}>Ayuda</h4>
              <div className="space-y-2 text-sm" style={{ color: `${NAVY}99` }}>
                <Link to="/faq" className="block hover:text-slate-900 transition-colors">Preguntas frecuentes</Link>
                <Link to="/terms" className="block hover:text-slate-900 transition-colors">Términos y condiciones</Link>
                <Link to="/privacy" className="block hover:text-slate-900 transition-colors">Políticas de privacidad</Link>
                <Link to="/contact" className="block hover:text-slate-900 transition-colors">Contáctanos</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-[0.14em] mb-3" style={{ color: NAVY }}>Contáctanos</h4>
              <div className="space-y-2 text-sm" style={{ color: `${NAVY}99` }}>
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: LIME }} /> Guatemala</p>
                <p className="flex items-center gap-1.5">✉ info@kuxtaltravelgt.com</p>
              </div>
            </div>
          </div>

          {/* App Store / Google Play band */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: NAVY }}>Descarga nuestra app</p>
              <div className="flex gap-3" data-testid="app-badges">
                <a href="#" aria-label="Disponible en App Store" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5" style={{ background: NAVY }}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  <div className="text-left leading-tight">
                    <p className="text-[9px] uppercase tracking-wider opacity-70">Disponible en</p>
                    <p className="text-sm font-bold">App Store</p>
                  </div>
                </a>
                <a href="#" aria-label="Disponible en Google Play" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5" style={{ background: NAVY }}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true"><path fill="#32bbff" d="M3.609 1.814L13.792 12 3.61 22.186a1 1 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"/><path fill="#32bbff" d="M14.5 12.71l2.43-2.43-3.37-1.9z" opacity="0.6"/><path fill="#ffd400" d="M16.93 10.28l-3.14 1.72 3.37 1.9 2.93-1.64a1 1 0 0 0 0-1.75z"/><path fill="#ff3a44" d="M13.79 12l-10.18 10.19a1 1 0 0 0 1.1.08l12.22-7z"/><path fill="#00c48b" d="M4.71 1.73a1 1 0 0 0-1.1.08L13.79 12l3.14-3.14z"/></svg>
                  <div className="text-left leading-tight">
                    <p className="text-[9px] uppercase tracking-wider opacity-70">Disponible en</p>
                    <p className="text-sm font-bold">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
            <p className="text-xs" style={{ color: `${NAVY}77` }}>
              &copy; {new Date().getFullYear()} Kuxtal Travels. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
