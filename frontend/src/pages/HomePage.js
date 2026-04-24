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
const NAVY_DEEP = '#061829';
const LIME = '#8CC63F';
const GOLD = '#D4AF5A';
const CHAMPAGNE = '#E5C989';

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

// Max allies to show in the home hero partners row (above this shows "y más aliados").
const PARTNERS_LIMIT = 8;

// Collage images for Kuxtal Club section (2x2) — each with a caption that tells the value prop.
const CLUB_COLLAGE = [
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&q=80',
    label: 'Destinos',
    caption: 'Paraísos exclusivos',
  },
  {
    src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop&q=80',
    label: 'Resorts',
    caption: 'Estadías premium',
  },
  {
    src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&q=80',
    label: 'Experiencias',
    caption: 'Gastronomía & eventos',
  },
  {
    src: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&h=600&fit=crop&q=80',
    label: 'Vuelos',
    caption: 'Tarifas preferenciales',
  },
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
  const [partners, setPartners] = useState([]);
  const [totalPartners, setTotalPartners] = useState(0);
  const navigate = useNavigate();
  useDocumentTitle(null);

  useEffect(() => {
    axios.get(`${API}/api/config/social-links`).then(r => setSocialLinks(r.data || {})).catch(() => {});
    axios.get(`${API}/api/packages?featured=true`).then(r => setPackages(r.data.slice(0, 6))).catch(() => {});
    axios.get(`${API}/api/countries`).then(r => setCountries(r.data)).catch(() => {});
    axios.get(`${API}/api/commerce`).then(r => {
      const all = Array.isArray(r.data) ? r.data : [];
      const featured = all.filter(c => c.featured);
      // Prefer featured curation; fall back to all commerces if admin hasn't curated yet
      const showcase = featured.length > 0 ? featured : all;
      setTotalPartners(all.length);
      setPartners(showcase.slice(0, PARTNERS_LIMIT));
    }).catch(() => {});
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
      <section className="relative min-h-[580px] sm:min-h-[680px] lg:min-h-[760px] flex items-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Resort tropical con piscina infinita" className="w-full h-full object-cover" />
          {/* Gradient overlay — stronger on mobile (top-to-bottom) so the text is readable full-width,
              diagonal on desktop so the image breathes on the right side */}
          <div className="absolute inset-0 sm:hidden" style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}f0 0%, ${NAVY_DEEP}cc 55%, ${NAVY_DEEP}f2 100%)` }} />
          <div className="absolute inset-0 hidden sm:block" style={{ background: `linear-gradient(100deg, ${NAVY_DEEP}f5 0%, ${NAVY}e0 38%, ${NAVY}55 60%, transparent 85%)` }} />
          {/* Subtle gold radial accent */}
          <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 18% 40%, ${GOLD}55 0, transparent 35%)` }} />
          {/* Fine arabesque texture */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `linear-gradient(${GOLD}55 1px, transparent 1px), linear-gradient(90deg, ${GOLD}55 1px, transparent 1px)`, backgroundSize: '88px 88px' }} />
          {/* Top/bottom gold hairlines */}
          <div className="absolute top-20 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${GOLD}55 30%, ${GOLD}88 50%, ${GOLD}55 70%, transparent 100%)` }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-16 sm:pb-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/20 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.28em] mb-5 sm:mb-7" style={{ borderColor: `${GOLD}55`, color: CHAMPAGNE }} data-testid="hero-eyebrow">
              <Crown className="w-3 h-3" style={{ color: GOLD }} /> Club privado · Miembros
            </span>

            <h1 className="font-heading text-4xl xs:text-5xl sm:text-6xl lg:text-7xl text-white font-black tracking-tight leading-[1.02] mb-3" data-testid="hero-title">
              Más que viajes,<br />
              <span className="italic font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${LIME} 0%, #B8E26A 50%, ${LIME} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                es pertenecer.
              </span>
            </h1>

            {/* Art-deco separator */}
            <div className="flex items-center gap-2 my-4 sm:my-5">
              <div className="h-px w-10 sm:w-12" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}99)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <div className="h-px w-10 sm:w-12" style={{ background: `linear-gradient(90deg, ${GOLD}99, transparent)` }} />
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-white/75 max-w-lg leading-relaxed mb-7 sm:mb-9 italic tracking-wide" data-testid="hero-subtitle">
              Accede a experiencias exclusivas, precios especiales y beneficios únicos con Kuxtal&nbsp;Travels.
            </p>

            <div className="flex flex-col xs:flex-row flex-wrap gap-3 mb-10 sm:mb-12">
              <Link to="/login">
                <Button
                  size="lg"
                  className="w-full xs:w-auto rounded-full h-12 px-6 sm:px-7 font-bold text-sm shadow-[0_10px_30px_-6px_rgba(140,198,63,0.55)] hover:shadow-[0_14px_36px_-6px_rgba(140,198,63,0.75)] transition-all hover:-translate-y-0.5"
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
                  className="w-full xs:w-auto rounded-full h-12 px-6 sm:px-7 font-semibold text-sm bg-white/5 backdrop-blur-sm hover:bg-white/15 transition-all"
                  style={{ borderColor: `${GOLD}66`, color: CHAMPAGNE }}
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
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 transition-all group-hover:scale-110" style={{ background: `${LIME}22`, border: `1px solid ${LIME}55` }}>
                    <p.icon className="w-5 h-5" strokeWidth={1.6} style={{ color: LIME }} />
                  </div>
                  <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] leading-tight" style={{ color: CHAMPAGNE }}>{p.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SEARCH BAND (dark luxury) ══════ */}
      <section className="relative -mt-6 sm:-mt-10 z-20" data-testid="search-band">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
          <div
            className="relative rounded-[22px] overflow-hidden shadow-[0_25px_70px_-20px_rgba(0,0,0,0.7)]"
            style={{
              background: `linear-gradient(145deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
              border: `1px solid ${GOLD}33`,
            }}
          >
            {/* Subtle gold radial accent inside the card */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 85% 15%, ${GOLD} 0, transparent 45%)` }} />
            {/* Top gold hairline */}
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />

            {/* Tabs */}
            <div className="relative flex gap-0.5 sm:gap-1 px-2 sm:px-4 pt-3 sm:pt-4" data-testid="search-tabs">
              {SEARCH_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSearchTab(tab.id)}
                  className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-5 py-2.5 rounded-t-xl text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap min-w-0`}
                  style={
                    searchTab === tab.id
                      ? {
                          background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                          color: NAVY_DEEP,
                          boxShadow: `0 6px 20px -6px rgba(212,175,90,0.55)`,
                        }
                      : { color: `${CHAMPAGNE}cc` }
                  }
                  data-testid={`search-tab-${tab.id}`}
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="relative p-3 sm:p-5 pt-3" data-testid="hero-search-form">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-[2] relative">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] px-3 mb-1 block" style={{ color: `${GOLD}cc` }}>Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${GOLD}` }} />
                    <Input
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder={currentTab.placeholder}
                      className="pl-10 h-12 rounded-xl border bg-black/30 text-white placeholder:text-white/40 focus:bg-black/50 transition-colors"
                      style={{ borderColor: `${GOLD}33` }}
                      data-testid="hero-search-input"
                      list="country-suggestions"
                    />
                    <datalist id="country-suggestions">
                      {countries.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 flex-1">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] px-3 mb-1 block" style={{ color: `${GOLD}cc` }}>Fecha</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: `${GOLD}` }} />
                      <Input
                        type="date"
                        value={dates}
                        onChange={e => setDates(e.target.value)}
                        className="pl-10 h-12 rounded-xl border bg-black/30 text-white focus:bg-black/50 transition-colors [color-scheme:dark]"
                        style={{ borderColor: `${GOLD}33` }}
                        data-testid="hero-search-date"
                      />
                    </div>
                  </div>

                  <div className="flex-1 sm:max-w-[130px]">
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] px-3 mb-1 block" style={{ color: `${GOLD}cc` }}>Viajeros</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${GOLD}` }} />
                      <select
                        value={guests}
                        onChange={e => setGuests(e.target.value)}
                        className="w-full pl-10 h-12 rounded-xl border bg-black/30 text-white text-sm appearance-none cursor-pointer focus:bg-black/50 transition-colors"
                        style={{ borderColor: `${GOLD}33` }}
                        data-testid="hero-search-guests"
                      >
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <option key={n} value={n} style={{ background: NAVY_DEEP, color: 'white' }}>{n}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: `${GOLD}aa` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="h-12 px-7 rounded-xl font-bold w-full sm:w-auto text-sm transition-all hover:-translate-y-0.5 shadow-[0_10px_30px_-6px_rgba(212,175,90,0.5)]"
                    style={{
                      background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                      color: NAVY_DEEP,
                      border: `1px solid ${GOLD}88`,
                    }}
                    data-testid="hero-search-btn"
                  >
                    <Search className="w-4 h-4 mr-1.5" /> Buscar
                  </Button>
                </div>
              </div>
            </form>

            {/* Bottom gold hairline */}
            <div className="absolute bottom-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}44, transparent)` }} />
          </div>

          {/* Popular destinations chips (dark luxury) */}
          {countries.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 pt-5 scrollbar-hide">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] whitespace-nowrap" style={{ color: `${CHAMPAGNE}aa` }}>Destinos populares:</span>
              {countries.slice(0, 8).map(c => (
                <Link
                  key={c}
                  to={`/search?country=${encodeURIComponent(c)}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all hover:-translate-y-0.5"
                  style={{
                    background: `${NAVY}80`,
                    border: `1px solid ${GOLD}33`,
                    color: CHAMPAGNE,
                    backdropFilter: 'blur(6px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${GOLD}18`;
                    e.currentTarget.style.borderColor = `${GOLD}77`;
                    e.currentTarget.style.color = '#F5E6B8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${NAVY}80`;
                    e.currentTarget.style.borderColor = `${GOLD}33`;
                    e.currentTarget.style.color = CHAMPAGNE;
                  }}
                  data-testid={`popular-dest-${c}`}
                >
                  <MapPin className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />{c}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════ KUXTAL CLUB — Tu membresía, un mundo de beneficios ══════ */}
      <section id="kuxtal-club-section" className="relative py-20 sm:py-28 overflow-hidden" style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }} data-testid="kuxtal-club-section">
        {/* Subtle gold radial accents */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${GOLD} 0, transparent 40%), radial-gradient(circle at 80% 80%, ${GOLD} 0, transparent 45%)` }} />
        {/* Arabesque dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${GOLD} 1px, transparent 0)`, backgroundSize: '34px 34px' }} />
        {/* Top gold hairline */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left text */}
          <div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] mb-4" style={{ color: CHAMPAGNE }}>
              · Kuxtal Club ·
            </p>
            <h2 className="font-heading text-3xl xs:text-4xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-2">
              Tu membresía,
            </h2>
            <h2 className="font-heading text-3xl xs:text-4xl sm:text-4xl lg:text-5xl font-black italic tracking-tight leading-[1.05] mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              un mundo de beneficios
            </h2>

            {/* Art-deco divider */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-10 sm:w-12" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}88)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <div className="h-px w-14 sm:w-20" style={{ background: `linear-gradient(90deg, ${GOLD}88, transparent)` }} />
            </div>

            <p className="text-white/65 text-sm sm:text-base leading-relaxed mb-8 max-w-lg italic">
              Somos un club de viajes diseñado para quienes buscan más que un destino. Vive experiencias inolvidables y disfruta beneficios en comercios aliados.
            </p>
            <Link to="/benefits">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full h-12 px-7 font-bold text-sm transition-all hover:-translate-y-0.5 shadow-[0_10px_30px_-6px_rgba(212,175,90,0.45)]"
                style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`, color: NAVY_DEEP, border: `1px solid ${GOLD}88` }}
                data-testid="club-see-benefits-btn"
              >
                Ver beneficios <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Right: Golden Member card + collage — mobile shows card first */}
          <div className="relative" data-testid="club-collage">
            {/* Mobile: stacked card + smaller collage */}
            <div className="lg:hidden">
              {/* Golden Member card — mobile */}
              <div className="mx-auto w-[85%] max-w-[320px] mb-6">
                <div
                  className="relative rounded-2xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, #2a1f10 0%, #1a1408 45%, #0f0a04 100%)`,
                    borderColor: `${GOLD}88`,
                  }}
                >
                  <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${GOLD}22 0, ${GOLD}22 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, ${GOLD}22 0, ${GOLD}22 2px, transparent 2px, transparent 10px)` }} />
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `linear-gradient(115deg, transparent 40%, ${GOLD}33 50%, transparent 60%)` }} />
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                  <div className="relative">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: CHAMPAGNE }}>Golden Member</p>
                    <div className="flex items-center justify-center py-3">
                      <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-12 w-auto drop-shadow-[0_4px_12px_rgba(212,175,90,0.35)]" />
                    </div>
                    <div className="flex items-center gap-2 my-3">
                      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
                      <Sparkles className="w-2.5 h-2.5" style={{ color: GOLD }} />
                      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
                    </div>
                    <p className="text-center font-heading text-sm tracking-[0.22em] font-bold" style={{ background: `linear-gradient(92deg, #B8944A 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                      ACCESO EXCLUSIVO
                    </p>
                  </div>
                </div>
              </div>
              {/* Collage — mobile 2x2 with captions */}
              <div className="grid grid-cols-2 gap-2.5">
                {CLUB_COLLAGE.map((item) => (
                  <div key={item.src} className="relative rounded-xl overflow-hidden ring-1 ring-[#D4AF5A]/20 aspect-[4/3] group">
                    <img src={item.src} alt={item.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {/* Gold hairline top */}
                    <div className="absolute top-0 left-3 right-3 h-px opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>{item.label}</p>
                      <p className="text-[11px] text-white/90 italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: 2x2 collage with floating card + captions */}
            <div className="hidden lg:block relative">
              <div className="grid grid-cols-2 gap-4">
                {CLUB_COLLAGE.map((item, i) => (
                  <div key={item.src} className={`relative rounded-2xl overflow-hidden ring-1 ring-[#D4AF5A]/20 aspect-[4/3] group ${i === 0 ? 'translate-y-3' : ''} ${i === 3 ? 'translate-y-3' : ''}`}>
                    <img src={item.src} alt={item.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-0 left-4 right-4 h-px opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>{item.label}</p>
                      <p className="text-sm text-white/90 italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Floating Golden Member card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] max-w-[360px]" data-testid="membership-card">
                <div
                  className="relative rounded-2xl p-5 shadow-[0_35px_70px_-15px_rgba(0,0,0,0.7)] ring-1 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, #2a1f10 0%, #1a1408 45%, #0f0a04 100%)`,
                    borderColor: `${GOLD}88`,
                  }}
                >
                  <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${GOLD}22 0, ${GOLD}22 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, ${GOLD}22 0, ${GOLD}22 2px, transparent 2px, transparent 10px)` }} />
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `linear-gradient(115deg, transparent 40%, ${GOLD}33 50%, transparent 60%)` }} />
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                  <div className="relative">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: CHAMPAGNE }}>Golden Member</p>
                    <div className="flex items-center justify-center py-3">
                      <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-14 w-auto drop-shadow-[0_4px_12px_rgba(212,175,90,0.35)]" />
                    </div>
                    <div className="flex items-center gap-2 my-3">
                      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
                      <Sparkles className="w-2.5 h-2.5" style={{ color: GOLD }} />
                      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
                    </div>
                    <p className="text-center font-heading text-base tracking-[0.22em] font-bold" style={{ background: `linear-gradient(92deg, #B8944A 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                      ACCESO EXCLUSIVO
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gold hairline */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
      </section>

      {/* ══════ DISFRUTA MÁS, PAGANDO MENOS (premium dark-gold) ══════ */}
      <section className="relative py-16 sm:py-24 overflow-hidden" style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)` }} data-testid="perks-section">
        {/* Gold radials */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 15% 30%, ${GOLD} 0, transparent 40%), radial-gradient(circle at 85% 70%, ${GOLD} 0, transparent 40%)` }} />
        {/* Arabesque dots */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${GOLD} 1px, transparent 0)`, backgroundSize: '30px 30px' }} />
        {/* Top & bottom gold hairlines */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Eyebrow with art-deco separator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 flex-wrap">
            <div className="h-px w-8 sm:w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.28em]" style={{ color: CHAMPAGNE }}>Beneficios exclusivos</p>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <div className="h-px w-8 sm:w-10" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
          </div>
          <div className="text-center mb-10 sm:mb-14 px-2">
            <h2 className="font-heading text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Disfruta{' '}
              <span className="italic" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                más
              </span>
              , pagando{' '}
              <span className="italic" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                menos
              </span>
            </h2>
          </div>

          {/* Mobile: 2x2 compact grid. Desktop: 4-up row. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {PERKS.map((p, i) => (
              <div
                key={p.title}
                className="group relative rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
                style={{
                  background: `linear-gradient(145deg, #0F1F33 0%, #0A1828 60%, #061220 100%)`,
                  border: `1px solid ${GOLD}22`,
                  boxShadow: `0 10px 30px -15px rgba(0,0,0,0.6)`,
                }}
                data-testid={`perk-${p.title}`}
              >
                {/* Top gold hairline on hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
                {/* Corner gold glow */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at top right, ${GOLD}33, transparent 70%)` }} />

                <div className="relative p-4 sm:p-6 text-center">
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD}18 0%, ${GOLD}08 100%)`,
                      border: `1px solid ${GOLD}44`,
                      boxShadow: `inset 0 0 0 1px ${GOLD}11`,
                    }}
                  >
                    <p.icon className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.5} style={{ color: GOLD }} />
                  </div>
                  <h3 className="font-heading font-bold text-[11px] sm:text-sm uppercase tracking-[0.1em] sm:tracking-wide mb-1.5 sm:mb-2 leading-tight" style={{ color: CHAMPAGNE }}>
                    {p.title}
                  </h3>
                  {/* Mini gold divider */}
                  <div className="flex items-center justify-center gap-1.5 mb-2 sm:mb-3">
                    <div className="h-px w-4 sm:w-6" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77)` }} />
                    <Sparkles className="w-2 h-2" style={{ color: GOLD }} />
                    <div className="h-px w-4 sm:w-6" style={{ background: `linear-gradient(90deg, ${GOLD}77, transparent)` }} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-white/55 leading-relaxed line-clamp-3">{p.desc}</p>
                </div>

                {/* Bottom corner decoration */}
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-tr-full pointer-events-none" style={{ background: `radial-gradient(circle at bottom left, ${GOLD}0F, transparent 70%)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ DESTINOS DESTACADOS (luxury magazine cream) ══════ */}
      {packages.length > 0 && (
        <section className="py-20 sm:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FAF8F3 0%, #F3EEE2 60%, #FAF8F3 100%)' }} data-testid="featured-packages">
          {/* Subtle gold marble veins */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 20% 20%, ${GOLD} 0, transparent 45%), radial-gradient(ellipse at 80% 70%, ${GOLD} 0, transparent 45%)` }} />
          {/* Top + bottom gold hairlines framing the section */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10 sm:mb-14 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-8 sm:w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
                  <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em]" style={{ color: '#8B6F2E' }}>Descubre la colección</p>
                </div>
                <h2 className="font-heading text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]" style={{ color: NAVY }}>
                  Destinos{' '}
                  <span className="italic font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #B8944A 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>destacados</span>
                </h2>
              </div>
              <Link to="/search" className="hidden sm:flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] transition-all hover:gap-3 group" style={{ color: NAVY }} data-testid="view-all-link">
                Ver todos
                <span className="w-8 h-px transition-all group-hover:w-12" style={{ background: GOLD }} />
                <ArrowRight className="w-4 h-4" style={{ color: GOLD }} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {packages.map((pkg, i) => (
                <Link
                  key={pkg._id}
                  to={`/trip/${pkg._id}`}
                  className="group relative block rounded-[22px] overflow-hidden transition-all duration-500 hover:-translate-y-2"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: `0 8px 24px -12px rgba(13,43,69,0.15), 0 0 0 1px ${GOLD}22`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 30px 60px -20px rgba(212,175,90,0.35), 0 0 0 1px ${GOLD}88`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 24px -12px rgba(13,43,69,0.15), 0 0 0 1px ${GOLD}22`;
                  }}
                  data-testid={`trip-card-${i}`}
                >
                  {/* Top gold hairline — appears on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

                  <div className="relative aspect-[4/5] overflow-hidden">
                    <ImageWithFallback
                      src={pkg.image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Bottom-to-top gradient for price legibility */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Category badge — navy serif premium */}
                    <div className="absolute top-4 left-4">
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{
                          background: `${NAVY_DEEP}ee`,
                          color: CHAMPAGNE,
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${GOLD}44`,
                        }}
                      >
                        {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
                      </span>
                    </div>

                    {/* Featured badge — gold metallic (replaces lime green) */}
                    {pkg.featured && (
                      <div className="absolute top-4 right-4">
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
                          style={{
                            background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                            color: NAVY_DEEP,
                            boxShadow: `0 6px 18px -4px rgba(212,175,90,0.6)`,
                            border: `1px solid ${GOLD}`,
                          }}
                        >
                          <Sparkles className="w-2.5 h-2.5" /> Exclusivo
                        </span>
                      </div>
                    )}

                    {/* Price pill — gold metallic with dark text */}
                    <div className="absolute bottom-4 right-4">
                      <div
                        className="px-4 py-2 rounded-xl text-base font-black backdrop-blur-sm"
                        style={{
                          background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                          color: NAVY_DEEP,
                          boxShadow: `0 8px 20px -6px rgba(212,175,90,0.55)`,
                          border: `1px solid ${GOLD}cc`,
                          fontFamily: '"Playfair Display", Georgia, serif',
                        }}
                      >
                        Q.{pkg.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Rating + duration row with gold star */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4" style={{ color: GOLD, fill: GOLD }} />
                        <span className="text-sm font-black" style={{ color: NAVY }}>{pkg.rating}</span>
                        <span className="text-xs" style={{ color: `${NAVY}55` }}>/5</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}77` }}>
                        {pkg.duration_days} días
                      </span>
                    </div>

                    {/* Mini gold hairline divider */}
                    <div className="h-px mb-3 opacity-40" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />

                    {/* Title — serif italic on hover */}
                    <h3
                      className="font-heading text-xl font-bold mb-2 line-clamp-1 transition-all duration-300"
                      style={{ color: NAVY }}
                    >
                      {pkg.title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-4 italic leading-relaxed" style={{ color: `${NAVY}88`, fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {pkg.short_description || pkg.description}
                    </p>

                    {/* Bottom row: location + arrow */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${GOLD}22` }}>
                      <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: NAVY }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: GOLD }} />
                        <span>{pkg.country}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all group-hover:gap-3" style={{ color: GOLD }}>
                        Ver detalle
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {pkg.promo_end && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: `${GOLD}22` }}>
                        <CountdownTimer endDate={pkg.promo_end} compact />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-14 sm:mt-16">
              <Link to="/search">
                <Button
                  size="lg"
                  className="rounded-full px-10 h-13 font-bold text-sm uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5 shadow-[0_15px_40px_-10px_rgba(212,175,90,0.5)] hover:shadow-[0_20px_50px_-10px_rgba(212,175,90,0.7)]"
                  style={{
                    background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                    color: NAVY_DEEP,
                    border: `1px solid ${GOLD}`,
                  }}
                  data-testid="view-all-packages-btn"
                >
                  Ver todos los destinos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <p className="mt-4 text-[11px] italic tracking-wide" style={{ color: `${NAVY}55`, fontFamily: '"Playfair Display", Georgia, serif' }}>
                + de 50 destinos curados, 6 continentes
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ══════ NUESTROS ALIADOS ══════ */}
      <section className="py-14 sm:py-18 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }} data-testid="partners-section">
        {/* Arabesque grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${GOLD} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />
        {/* Top & bottom gold hairlines */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 flex-wrap">
            <div className="h-px w-8 sm:w-12" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em]" style={{ color: CHAMPAGNE }}>
              Nuestros aliados
            </p>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <div className="h-px w-8 sm:w-12" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 lg:gap-x-14 gap-y-5 sm:gap-y-6">
            {partners.length === 0 && (
              <p className="text-center text-xs sm:text-sm italic" style={{ color: `${CHAMPAGNE}88`, fontFamily: '"Playfair Display", Georgia, serif' }}>
                Próximamente compartiremos nuestra red de aliados selectos.
              </p>
            )}
            {partners.map(p => (
              <Link
                key={p._id}
                to={`/commerce/${p._id}`}
                className="text-center group transition-all hover:opacity-100 opacity-80 hover:-translate-y-0.5"
                data-testid={`partner-${p.name}`}
              >
                {p.logo_url ? (
                  <div className="h-10 sm:h-12 flex items-center justify-center mb-1">
                    <img src={p.logo_url} alt={p.name} className="max-h-full max-w-[140px] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                  </div>
                ) : (
                  <p className="text-lg sm:text-2xl font-black text-white tracking-tight group-hover:text-[#E5C989] transition-colors" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {p.name}
                  </p>
                )}
                {p.category && (
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.28em] mt-0.5" style={{ color: `${CHAMPAGNE}88` }}>
                    {p.category}
                  </p>
                )}
              </Link>
            ))}
            {totalPartners > PARTNERS_LIMIT && (
              <Link to="/benefits" className="text-center hover:-translate-y-0.5 transition-all" data-testid="more-partners-link">
                <p className="text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.26em] font-bold italic" style={{ color: GOLD, fontFamily: '"Playfair Display", Georgia, serif' }}>
                  y {totalPartners - PARTNERS_LIMIT}+<br />aliados más
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="relative py-16 sm:py-24 overflow-hidden" data-testid="final-cta">
        <div className="absolute inset-0">
          <img src={CTA_IMG} alt="Destino paradisíaco" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${NAVY_DEEP}f5 0%, ${NAVY}e8 45%, ${NAVY}d8 100%)` }} />
          {/* Gold radial */}
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 25% 50%, ${GOLD} 0, transparent 45%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-8 sm:w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.28em]" style={{ color: CHAMPAGNE }}>Únete al Club</p>
            </div>

            <h2 className="font-heading text-3xl xs:text-4xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-2">
              El mundo es mejor
            </h2>
            <h2 className="font-heading text-3xl xs:text-4xl sm:text-4xl lg:text-5xl font-black italic tracking-tight leading-[1.05] mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              cuando eres miembro.
            </h2>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-7 max-w-md italic">
              Únete a Kuxtal Club y comienza a disfrutar un mundo de beneficios desde hoy.
            </p>
            <Link to="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full h-13 px-8 font-bold text-sm shadow-[0_10px_30px_-6px_rgba(140,198,63,0.55)] hover:shadow-[0_14px_36px_-6px_rgba(140,198,63,0.75)] transition-all hover:-translate-y-0.5"
                style={{ background: LIME, color: NAVY_DEEP }}
                data-testid="final-cta-btn"
              >
                Hazte miembro hoy <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Right side benefits */}
          <div className="space-y-3 sm:space-y-4">
            {[
              { icon: Crown, title: 'Plataforma Digital de Socios', desc: 'Gestiona tu membresía, cotizaciones y beneficios desde un solo lugar.' },
              { icon: Lock, title: 'Acceso Inmediato', desc: 'Comienza a disfrutar tus beneficios desde el primer día.' },
              { icon: ShieldCheck, title: 'Respaldo Kuxtal', desc: 'Más de 10 años conectando socios con experiencias únicas.' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10" style={{ border: `1px solid ${GOLD}22` }}>
                <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55` }}>
                  <b.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: GOLD }} strokeWidth={1.6} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wide mb-1" style={{ color: CHAMPAGNE }}>{b.title}</p>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FOOTER (dark premium) ══════ */}
      <footer className="relative pt-10 sm:pt-14 pb-20 sm:pb-10 overflow-hidden" style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, #040f1c 100%)` }} data-testid="footer">
        {/* Gold radial + dot grid */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${GOLD} 0, transparent 40%)` }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${GOLD} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />
        {/* Top gold hairline */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Brand block — full width on mobile, on top */}
          <div className="mb-8 sm:mb-10 text-center sm:text-left">
            <img src={LOGO_URL} alt="Kuxtal Travels" className="h-11 sm:h-12 w-auto mb-3 mx-auto sm:mx-0 brightness-0 invert opacity-90" />
            <p className="text-xs sm:text-sm leading-relaxed italic max-w-xs mx-auto sm:mx-0" style={{ color: `${CHAMPAGNE}99` }}>
              "Kuxtal" significa <em>vida</em> en maya. Cada destino, una historia.
            </p>
            {(socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.twitter || socialLinks.youtube || socialLinks.linkedin || socialLinks.whatsapp) && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4" data-testid="footer-socials">
                {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="Facebook" data-testid="social-facebook"><Facebook className="w-4 h-4" /></a>}
                {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="Instagram" data-testid="social-instagram"><Instagram className="w-4 h-4" /></a>}
                {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="TikTok" data-testid="social-tiktok">TT</a>}
                {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="X" data-testid="social-twitter"><Twitter className="w-4 h-4" /></a>}
                {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="YouTube" data-testid="social-youtube"><Youtube className="w-4 h-4" /></a>}
                {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="LinkedIn" data-testid="social-linkedin"><Linkedin className="w-4 h-4" /></a>}
                {socialLinks.whatsapp && <a href={socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}33`, color: CHAMPAGNE }} aria-label="WhatsApp" data-testid="social-whatsapp"><MessageCircle className="w-4 h-4" /></a>}
              </div>
            )}
          </div>

          {/* Art-deco separator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}55)` }} />
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(90deg, ${GOLD}55, transparent)` }} />
          </div>

          {/* Navigation + Contact — 2 cols on mobile, keep tight */}
          <div className="grid grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-10">
            <div>
              <h4 className="font-heading font-bold text-[10px] sm:text-xs uppercase tracking-[0.22em] mb-3 sm:mb-4" style={{ color: GOLD }}>Navegación</h4>
              <div className="space-y-2 sm:space-y-2.5 text-sm" style={{ color: `${CHAMPAGNE}99` }}>
                <Link to="/" className="block hover:text-white transition-colors">Inicio</Link>
                <Link to="/search" className="block hover:text-white transition-colors">Viajes</Link>
                <Link to="/benefits" className="block hover:text-white transition-colors">Kuxtal Club</Link>
                <Link to="/partners" className="block hover:text-white transition-colors">Aliados</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Acceso socios</Link>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-bold text-[10px] sm:text-xs uppercase tracking-[0.22em] mb-3 sm:mb-4" style={{ color: GOLD }}>Contáctanos</h4>
              <div className="space-y-2 sm:space-y-2.5 text-sm" style={{ color: `${CHAMPAGNE}99` }}>
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <span>Guatemala, Centroamérica</span>
                </p>
                <a href="mailto:info@kuxtaltravelgt.com" className="flex items-start gap-2 hover:text-white transition-colors break-all">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD }}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                  <span className="text-xs sm:text-sm">info@kuxtaltravelgt.com</span>
                </a>
                {socialLinks.whatsapp && (
                  <a href={socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-white transition-colors">
                    <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-5 sm:pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left" style={{ borderColor: `${GOLD}22` }}>
            <p className="text-[11px] sm:text-xs" style={{ color: `${CHAMPAGNE}66` }}>
              &copy; {new Date().getFullYear()} Kuxtal Travels. Todos los derechos reservados.
            </p>
            <p className="text-[10px] sm:text-[11px] italic tracking-wide" style={{ color: `${CHAMPAGNE}55`, fontFamily: '"Playfair Display", Georgia, serif' }}>
              Cada destino, una historia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
