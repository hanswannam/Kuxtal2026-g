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
          <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${NAVY_DEEP}f5 0%, ${NAVY}e0 38%, ${NAVY}55 60%, transparent 85%)` }} />
          {/* Subtle gold radial accent */}
          <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 18% 40%, ${GOLD}55 0, transparent 35%)` }} />
          {/* Fine arabesque texture */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `linear-gradient(${GOLD}55 1px, transparent 1px), linear-gradient(90deg, ${GOLD}55 1px, transparent 1px)`, backgroundSize: '88px 88px' }} />
          {/* Top/bottom gold hairlines */}
          <div className="absolute top-20 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${GOLD}55 30%, ${GOLD}88 50%, ${GOLD}55 70%, transparent 100%)` }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-black/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-[0.28em] mb-7" style={{ borderColor: `${GOLD}55`, color: CHAMPAGNE }} data-testid="hero-eyebrow">
              <Crown className="w-3 h-3" style={{ color: GOLD }} /> Club privado de viajes · Miembros
            </span>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl text-white font-black tracking-tight leading-[1.02] mb-3" data-testid="hero-title">
              Más que viajes,<br />
              <span className="italic font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${LIME} 0%, #B8E26A 50%, ${LIME} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                es pertenecer.
              </span>
            </h1>

            {/* Art-deco separator */}
            <div className="flex items-center gap-2 my-5">
              <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}99)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${GOLD}99, transparent)` }} />
            </div>

            <p className="text-base sm:text-lg text-white/75 max-w-lg leading-relaxed mb-9 italic tracking-wide" data-testid="hero-subtitle">
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
                  className="rounded-full h-12 px-7 font-semibold text-sm bg-white/5 backdrop-blur-sm hover:bg-white/15 transition-all"
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
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-all group-hover:scale-110" style={{ background: `${LIME}22`, border: `1px solid ${LIME}55` }}>
                    <p.icon className="w-5 h-5" strokeWidth={1.6} style={{ color: LIME }} />
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] leading-tight" style={{ color: CHAMPAGNE }}>{p.title}</p>
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
            <p className="text-xs font-bold uppercase tracking-[0.28em] mb-4" style={{ color: CHAMPAGNE }}>
              · Kuxtal Club ·
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-2">
              Tu membresía,
            </h2>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tight leading-[1.05] mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              un mundo de beneficios
            </h2>

            {/* Art-deco divider */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}88)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <div className="h-px w-20" style={{ background: `linear-gradient(90deg, ${GOLD}88, transparent)` }} />
            </div>

            <p className="text-white/65 text-base leading-relaxed mb-8 max-w-lg italic">
              Somos un club de viajes diseñado para quienes buscan más que un destino. Vive experiencias inolvidables y disfruta beneficios en comercios aliados.
            </p>
            <Link to="/benefits">
              <Button
                size="lg"
                className="rounded-full h-12 px-7 font-bold text-sm transition-all hover:-translate-y-0.5 shadow-[0_10px_30px_-6px_rgba(212,175,90,0.45)]"
                style={{ background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`, color: NAVY_DEEP, border: `1px solid ${GOLD}88` }}
                data-testid="club-see-benefits-btn"
              >
                Ver beneficios <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Right: 2x2 collage with floating GOLDEN MEMBER card */}
          <div className="relative" data-testid="club-collage">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {CLUB_COLLAGE.map((src, i) => (
                <div key={src} className={`relative rounded-2xl overflow-hidden ring-1 ring-white/10 aspect-[4/3] ${i === 0 ? 'translate-y-3' : ''} ${i === 3 ? 'translate-y-3' : ''}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
                {/* Arabesque gold pattern overlay */}
                <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${GOLD}22 0, ${GOLD}22 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, ${GOLD}22 0, ${GOLD}22 2px, transparent 2px, transparent 10px)` }} />
                {/* Gold shimmer sweeps */}
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `linear-gradient(115deg, transparent 40%, ${GOLD}33 50%, transparent 60%)` }} />
                {/* Top & bottom gold hairlines */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa, transparent)` }} />

                <div className="relative">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: CHAMPAGNE }}>
                    Golden Member
                  </p>
                  <div className="flex items-center justify-center py-3">
                    <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-14 w-auto drop-shadow-[0_4px_12px_rgba(212,175,90,0.35)]" />
                  </div>
                  <div className="flex items-center gap-2 my-3">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
                    <Sparkles className="w-2.5 h-2.5" style={{ color: GOLD }} />
                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
                  </div>
                  <p
                    className="text-center font-heading text-base tracking-[0.22em] font-bold"
                    style={{
                      background: `linear-gradient(92deg, #B8944A 0%, #F5E6B8 50%, ${GOLD} 100%)`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    ACCESO EXCLUSIVO
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gold hairline */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
      </section>

      {/* ══════ DISFRUTA MÁS, PAGANDO MENOS ══════ */}
      <section className="py-20 sm:py-24 relative" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F3 100%)' }} data-testid="perks-section">
        {/* Subtle gold marble */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${GOLD} 0, transparent 40%), radial-gradient(circle at 80% 80%, ${GOLD} 0, transparent 40%)` }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Eyebrow with art-deco separator */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: '#8B6F2E' }}>Beneficios exclusivos</p>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <div className="h-px w-10" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
          </div>
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: NAVY }}>
              Disfruta{' '}
              <span className="italic" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: LIME }}>
                más
              </span>
              , pagando{' '}
              <span className="italic" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: LIME }}>
                menos
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map((p) => (
              <div
                key={p.title}
                className="group relative rounded-2xl p-6 bg-white border border-slate-100 hover:border-[color:var(--gold-border)] hover:shadow-[0_25px_50px_-20px_rgba(212,175,90,0.3)] transition-all hover:-translate-y-1 text-center overflow-hidden"
                style={{ '--gold-border': `${GOLD}66` }}
                data-testid={`perk-${p.title}`}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110" style={{ background: `${LIME}18`, color: NAVY, boxShadow: `inset 0 0 0 1px ${LIME}33` }}>
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
        <section className="py-20 sm:py-24 relative" style={{ background: 'linear-gradient(180deg, #FAF8F3 0%, #F3EEE2 100%)' }} data-testid="featured-packages">
          {/* Subtle gold marble */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${GOLD} 0, transparent 40%), radial-gradient(circle at 80% 70%, ${GOLD} 0, transparent 40%)` }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
                  <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: '#8B6F2E' }}>Descubre la colección</p>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: NAVY }}>
                  Destinos{' '}
                  <span className="italic" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: LIME }}>destacados</span>
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
      <section className="py-14 sm:py-18 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }} data-testid="partners-section">
        {/* Arabesque grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${GOLD} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />
        {/* Top & bottom gold hairlines */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em]" style={{ color: CHAMPAGNE }}>
              Nuestros aliados
            </p>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-10 sm:gap-x-14 gap-y-6">
            {PARTNERS.map(p => (
              <div key={p.name} className="text-center group transition-all hover:opacity-100 opacity-80" data-testid={`partner-${p.name}`}>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{p.name}</p>
                {p.tag && <p className="text-[10px] uppercase tracking-[0.28em] mt-0.5" style={{ color: `${CHAMPAGNE}88` }}>{p.tag}</p>}
              </div>
            ))}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.26em] font-bold italic" style={{ color: GOLD, fontFamily: '"Playfair Display", Georgia, serif' }}>y más aliados<br />especiales</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="relative py-24 overflow-hidden" data-testid="final-cta">
        <div className="absolute inset-0">
          <img src={CTA_IMG} alt="Destino paradisíaco" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${NAVY_DEEP}f5 0%, ${NAVY}e8 45%, ${NAVY}c8 100%)` }} />
          {/* Gold radial */}
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse at 25% 50%, ${GOLD} 0, transparent 45%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}77, transparent)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: CHAMPAGNE }}>Únete al Club</p>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05] mb-2">
              El mundo es mejor
            </h2>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tight leading-[1.05] mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif', background: `linear-gradient(92deg, ${GOLD} 0%, #F5E6B8 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              cuando eres miembro.
            </h2>

            <p className="text-white/70 text-base leading-relaxed mb-7 max-w-md italic">
              Únete a Kuxtal Club y comienza a disfrutar un mundo de beneficios desde hoy.
            </p>
            <Link to="/login">
              <Button
                size="lg"
                className="rounded-full h-13 px-8 font-bold text-sm shadow-[0_10px_30px_-6px_rgba(140,198,63,0.55)] hover:shadow-[0_14px_36px_-6px_rgba(140,198,63,0.75)] transition-all hover:-translate-y-0.5"
                style={{ background: LIME, color: NAVY_DEEP }}
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
              <div key={b.title} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10" style={{ border: `1px solid ${GOLD}22` }}>
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}55` }}>
                  <b.icon className="w-6 h-6" style={{ color: GOLD }} strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: CHAMPAGNE }}>{b.title}</p>
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
