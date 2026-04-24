import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, MapPin, Phone, Store, Star, Heart, Shield, Globe, ArrowUpRight, Sparkles, ExternalLink, Flame } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getLucideComponent } from '../components/LucideIconPicker';

const API = process.env.REACT_APP_BACKEND_URL;
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png";

// Unified palette: charcoal + white + single gold accent. Per-category we tint the category
// strip/chip with a soft pastel — but the benefit & CTA always use the unified gold/charcoal.
const CATEGORY_CONFIG = {
  'Restaurantes': { icon: Store, tint: 'bg-orange-50', chip: 'bg-orange-100 text-orange-800', strip: 'bg-orange-500' },
  'Belleza': { icon: Heart, tint: 'bg-pink-50', chip: 'bg-pink-100 text-pink-800', strip: 'bg-pink-500' },
  'Deportes': { icon: Shield, tint: 'bg-emerald-50', chip: 'bg-emerald-100 text-emerald-800', strip: 'bg-emerald-500' },
  'Mascotas': { icon: Store, tint: 'bg-amber-50', chip: 'bg-amber-100 text-amber-800', strip: 'bg-amber-500' },
  'Hospitales': { icon: Globe, tint: 'bg-blue-50', chip: 'bg-blue-100 text-blue-800', strip: 'bg-blue-500' },
  'Entretenimiento': { icon: Star, tint: 'bg-violet-50', chip: 'bg-violet-100 text-violet-800', strip: 'bg-violet-500' },
  'Servicios': { icon: Sparkles, tint: 'bg-slate-50', chip: 'bg-slate-100 text-slate-800', strip: 'bg-slate-500' },
  'Tecnología': { icon: Globe, tint: 'bg-cyan-50', chip: 'bg-cyan-100 text-cyan-800', strip: 'bg-cyan-500' },
  'Educación': { icon: Star, tint: 'bg-indigo-50', chip: 'bg-indigo-100 text-indigo-800', strip: 'bg-indigo-500' },
  'Moda Mujer': { icon: Heart, tint: 'bg-rose-50', chip: 'bg-rose-100 text-rose-800', strip: 'bg-rose-500' },
  'Moda Hombre': { icon: Shield, tint: 'bg-sky-50', chip: 'bg-sky-100 text-sky-800', strip: 'bg-sky-500' },
  'Hogar': { icon: Store, tint: 'bg-teal-50', chip: 'bg-teal-100 text-teal-800', strip: 'bg-teal-500' },
};

function getCatConfig(cat) {
  return CATEGORY_CONFIG[cat] || { icon: Store, tint: 'bg-gray-50', chip: 'bg-gray-100 text-gray-800', strip: 'bg-gray-500' };
}

// Extract a discount headline from a free-form benefit description.
// Preference: "%" discounts > "2x1" > "desde Qxxx" > "gratis/GRATIS" > generic text preview
function extractBenefitHighlight(text = '') {
  const t = String(text).trim();
  if (!t) return null;
  const pct = t.match(/(\d{1,3})\s*%/);
  if (pct) return { label: `${pct[1]}% OFF`, kind: 'pct' };
  if (/\b2x1\b/i.test(t)) return { label: '2×1', kind: 'bogo' };
  const qmatch = t.match(/\b(desde|from)\s*Q\s*([\d,.]+)/i);
  if (qmatch) return { label: `Desde Q${qmatch[2]}`, kind: 'price' };
  if (/\bgratis\b/i.test(t)) return { label: 'GRATIS', kind: 'free' };
  // fallback: first 3 words uppercased
  const short = t.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
  return { label: short, kind: 'text' };
}

function shortDesc(text = '', maxLen = 65) {
  const t = String(text).trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > maxLen ? t.slice(0, maxLen - 1).trimEnd() + '…' : t;
}

// Renders a category icon: emoji, uploaded image URL, or lucide:Name. Falls back to a Lucide component.
function CatIconRender({ icon, fallback: Fallback = Store, className = 'w-3.5 h-3.5', monochrome = false }) {
  if (!icon) return <Fallback className={className} />;
  const Lc = getLucideComponent(icon);
  if (Lc) return <Lc className={className} strokeWidth={1.8} />;
  // In monochrome mode skip colored emojis/images entirely — fall back to the neutral lucide icon
  if (monochrome) return <Fallback className={className} />;
  if (icon.startsWith('http') || icon.startsWith('/')) {
    return <img src={icon} alt="" className={`${className} object-contain inline-block`} />;
  }
  return <span className="inline-block leading-none">{icon}</span>;
}

export default function BenefitsPage() {
  const [searchParams] = useSearchParams();
  const [commerces, setCommerces] = useState([]);
  const [categories, setCategories] = useState([]); // objects: { name, icon, system }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  useDocumentTitle('Kuxtal Club - Beneficios');

  useEffect(() => {
    axios.get(`${API}/api/commerce/categories?full=true`).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    axios.get(`${API}/api/commerce?${params.toString()}`).then(r => { setCommerces(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [search, category]);

  const activeCatConfig = category ? getCatConfig(category) : null;
  const activeCatData = category ? categories.find(c => c.name === category) : null;

  return (
    <div className="min-h-screen" data-testid="benefits-page">
      {/* Hero Header */}
      <section className="relative pt-20 overflow-hidden" data-testid="benefits-hero">
        {/* Deep obsidian base */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 20%, #1a1a24 0%, #0B0B0F 55%, #050507 100%)' }} />
        {/* Gold accents via radials */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(212,175,90,0.45) 0, transparent 35%), radial-gradient(circle at 85% 75%, rgba(212,175,90,0.25) 0, transparent 40%)' }} />
        {/* Art-deco grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(212,175,90,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,90,0.5) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
        {/* Top gold shimmer line */}
        <div className="absolute top-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF5A]/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col items-center text-center sm:text-left sm:items-start gap-5 mb-9">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF5A]/30 via-transparent to-[#D4AF5A]/20 blur-2xl" />
              <img src={CLUB_LOGO} alt="Kuxtal Club" className="relative h-16 sm:h-24 w-auto drop-shadow-[0_10px_30px_rgba(200,38,62,0.45)]" data-testid="benefits-club-logo" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF5A]/30 bg-[#D4AF5A]/5 text-[#E5C989] text-[10px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm">
                <Sparkles className="w-3 h-3" /> Programa Exclusivo
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-black text-[#F4EBD0] tracking-tight leading-[1.05] mt-4">
                Comercios{' '}
                <span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(92deg, #B8944A 0%, #F5E6B8 45%, #D4AF5A 55%, #8B6F2E 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 2px 20px rgba(212,175,90,0.2)',
                  }}
                >
                  Aliados
                </span>
              </h1>
              <div className="flex items-center gap-2 my-3">
                <div className="h-px w-10 bg-gradient-to-r from-[#D4AF5A]/60 to-transparent" />
                <Sparkles className="w-3 h-3 text-[#D4AF5A]" />
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4AF5A]/60 hidden sm:block" />
              </div>
              <p className="text-[#F4EBD0]/60 text-sm sm:text-base max-w-xl mx-auto sm:mx-0 italic tracking-wide">
                Descuentos y beneficios exclusivos en los mejores comercios de Guatemala para socios Kuxtal
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto sm:mx-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF5A]/60" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar comercio, categoría o beneficio..."
                className="pl-12 h-14 rounded-2xl bg-black/40 border-[#D4AF5A]/20 text-[#F4EBD0] placeholder:text-[#F4EBD0]/30 focus:bg-black/60 focus:border-[#D4AF5A]/60 focus:ring-2 focus:ring-[#D4AF5A]/20 backdrop-blur-sm"
                data-testid="commerce-search"
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-7" data-testid="category-filters">
            <button
              onClick={() => setCategory('')}
              className={`flex items-center justify-center gap-1 px-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all uppercase tracking-[0.12em] sm:tracking-[0.18em] ${
                category === ''
                  ? 'text-[#0B0B0F] shadow-lg shadow-[#D4AF5A]/40'
                  : 'bg-white/[0.04] text-[#F4EBD0]/70 hover:bg-[#D4AF5A]/10 hover:text-[#F4EBD0] border border-[#D4AF5A]/15 hover:border-[#D4AF5A]/40 backdrop-blur-sm'
              }`}
              style={category === '' ? { background: 'linear-gradient(135deg, #F5E6B8 0%, #D4AF5A 50%, #B8944A 100%)' } : {}}
              data-testid="cat-all"
            >
              Todos
            </button>
            {categories.map(cat => {
              const name = cat.name;
              const conf = getCatConfig(name);
              const isActive = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  title={name}
                  className={`flex items-center justify-center gap-1 px-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-semibold transition-all uppercase tracking-[0.12em] sm:tracking-[0.18em] ${
                    isActive
                      ? 'text-[#0B0B0F] shadow-lg shadow-[#D4AF5A]/40'
                      : 'bg-white/[0.04] text-[#F4EBD0]/70 hover:bg-[#D4AF5A]/10 hover:text-[#F4EBD0] border border-[#D4AF5A]/15 hover:border-[#D4AF5A]/40 backdrop-blur-sm'
                  }`}
                  style={isActive ? { background: 'linear-gradient(135deg, #F5E6B8 0%, #D4AF5A 50%, #B8944A 100%)' } : {}}
                  data-testid={`cat-${name}`}
                >
                  <CatIconRender icon={cat.icon} fallback={conf.icon} className={`w-3 h-3 shrink-0 ${isActive ? 'text-[#0B0B0F]' : 'text-[#D4AF5A]/70'}`} monochrome />
                  <span className="truncate">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Bottom gold shimmer divider */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-[#D4AF5A]/40 to-transparent" />
      </section>

      {/* Active Category Banner */}
      {category && activeCatConfig && (
        <div className="bg-[#0B0B0F] border-b border-[#D4AF5A]/20 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F4EBD0]">
              <CatIconRender icon={activeCatData?.icon} fallback={activeCatConfig.icon} className="w-5 h-5 text-[#D4AF5A]" />
              <span className="font-semibold text-sm uppercase tracking-wider">{category}</span>
              <span className="text-[#F4EBD0]/50 text-sm">— {commerces.length} comercios</span>
            </div>
            <button onClick={() => setCategory('')} className="text-[#E5C989] hover:text-[#F5E6B8] text-xs font-semibold uppercase tracking-wider">
              Ver todos
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <section className="py-12 relative" style={{ background: 'linear-gradient(180deg, #FAF8F3 0%, #F3EEE2 100%)' }}>
        {/* Subtle marble texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #D4AF5A 0, transparent 40%), radial-gradient(circle at 80% 70%, #D4AF5A 0, transparent 40%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#D4AF5A]/40" />
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#8B6F2E]">
                {loading ? 'Cargando colección…' : `${commerces.length} ${commerces.length === 1 ? 'comercio exclusivo' : 'comercios exclusivos'}`}
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF5A]/40 to-transparent" />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-[22px] overflow-hidden ring-1 ring-white/5 animate-pulse" style={{ background: 'linear-gradient(145deg, #0F0F14 0%, #16161C 55%, #0B0B0F 100%)' }}>
                  <div className="h-[3px] bg-gradient-to-r from-transparent via-[#D4AF5A]/30 to-transparent" />
                  <div className="p-6 space-y-4">
                    <div className="h-5 w-24 bg-[#D4AF5A]/10 rounded-full" />
                    <div className="w-28 h-28 bg-[#D4AF5A]/10 rounded-2xl mx-auto" />
                    <div className="h-10 bg-[#D4AF5A]/10 rounded-xl w-2/3 mx-auto" />
                    <div className="h-4 bg-white/5 rounded w-1/2 mx-auto" />
                    <div className="h-3 bg-white/5 rounded w-3/4 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && commerces.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Sin comercios disponibles</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {category ? `No hay comercios en la categoría "${category}"` : 'Pronto agregaremos mas comercios aliados'}
              </p>
              {category && (
                <Button variant="outline" className="rounded-full" onClick={() => setCategory('')} data-testid="clear-category-btn">
                  Ver todos los comercios
                </Button>
              )}
            </div>
          )}

          {/* Commerce Grid */}
          {!loading && commerces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {commerces.map((c, i) => {
                const conf = getCatConfig(c.category);
                const catData = categories.find(x => x.name === c.category);
                const highlight = extractBenefitHighlight(c.benefit_description);
                const isFeatured = !!c.featured || (c.promotions && c.promotions.length > 0);
                const hasHotDeal = highlight && highlight.kind === 'pct' && parseInt(highlight.label) >= 20;

                return (
                  <Link
                    key={c._id}
                    to={`/commerce/${c._id}`}
                    className={`group relative rounded-[22px] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 ${isFeatured ? 'ring-1 ring-[#D4AF5A]/40 shadow-[0_20px_50px_-20px_rgba(212,175,90,0.5)] hover:shadow-[0_30px_80px_-20px_rgba(212,175,90,0.65)]' : 'ring-1 ring-white/5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.8)] hover:ring-[#D4AF5A]/30'}`}
                    data-testid={`commerce-card-${i}`}
                    style={{
                      background:
                        'linear-gradient(145deg, #0F0F14 0%, #16161C 55%, #0B0B0F 100%)',
                    }}
                  >
                    {/* Gold hairline border (inner) */}
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-[#D4AF5A]/10" />

                    {/* Top gold shimmer bar */}
                    <div className="h-[3px] bg-gradient-to-r from-transparent via-[#D4AF5A] to-transparent opacity-80" />

                    {/* Featured ribbon */}
                    {isFeatured && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF5A] via-[#F5E6B8] to-[#D4AF5A] text-[#0B0B0F] text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-1 shadow-lg shadow-[#D4AF5A]/40">
                          <Star className="w-2.5 h-2.5 fill-current" /> Exclusivo
                        </div>
                      </div>
                    )}

                    {/* Category & offer chips */}
                    <div className="relative px-6 pt-6 pb-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF5A]/10 border border-[#D4AF5A]/25 text-[#E5C989] text-[10px] font-semibold uppercase tracking-[0.18em]">
                        <CatIconRender icon={catData?.icon} fallback={conf.icon} className="w-3 h-3" />
                        {c.category}
                      </span>
                      {hasHotDeal && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-400/30 text-red-300 text-[10px] font-bold uppercase tracking-wider">
                          <Flame className="w-3 h-3" /> Oferta
                        </span>
                      )}
                    </div>

                    {/* LARGE Logo in premium gold-ring frame */}
                    <div className="relative flex justify-center pt-4 pb-2">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#D4AF5A]/40 via-transparent to-[#D4AF5A]/40 blur-md" />
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDFCF7 0%, #F4EBD0 100%)', boxShadow: 'inset 0 0 0 2px rgba(212,175,90,0.3), 0 10px 30px -10px rgba(0,0,0,0.6)' }}>
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain p-3" />
                          ) : catData?.icon ? (
                            <CatIconRender icon={catData.icon} fallback={conf.icon} className="w-16 h-16 text-[#8B6F2E]" />
                          ) : (
                            <conf.icon className="w-16 h-16 text-[#8B6F2E]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 pt-3 pb-6 text-center relative">
                      {/* BENEFIT — gold shimmer headline */}
                      {highlight && (
                        <div className="mb-2">
                          <div
                            className="font-heading text-4xl sm:text-5xl font-black tracking-tight leading-none"
                            style={{
                              background:
                                'linear-gradient(92deg, #B8944A 0%, #F5E6B8 45%, #D4AF5A 55%, #8B6F2E 100%)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                              textShadow: '0 2px 20px rgba(212,175,90,0.15)',
                            }}
                          >
                            {highlight.label}
                          </div>
                        </div>
                      )}

                      {/* Separator */}
                      <div className="flex items-center justify-center gap-2 my-3">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF5A]/50" />
                        <Sparkles className="w-3 h-3 text-[#D4AF5A]" />
                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#D4AF5A]/50" />
                      </div>

                      {/* Merchant name */}
                      <h3 className="font-heading text-xl font-bold text-[#F4EBD0] group-hover:text-[#F5E6B8] transition-colors line-clamp-1 mb-1">
                        {c.name}
                      </h3>

                      {/* 1-line description */}
                      {c.description && (
                        <p className="text-[11px] text-white/40 italic line-clamp-1 mb-4 tracking-wide">
                          {shortDesc(c.description)}
                        </p>
                      )}

                      {/* Footer: location + phone */}
                      {(c.location || c.phone) && (
                        <div className="flex items-center justify-center gap-4 text-[10px] text-white/45 pt-3 border-t border-[#D4AF5A]/10">
                          {c.location && (
                            <span className="flex items-center gap-1 line-clamp-1"><MapPin className="w-3 h-3 shrink-0 text-[#D4AF5A]/60" /> {c.location}</span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0 text-[#D4AF5A]/60" /> {c.phone}</span>
                          )}
                          {c.website && !c.location && !c.phone && (
                            <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3 shrink-0 text-[#D4AF5A]/60" /> Sitio web</span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4AF5A]/25 bg-[#D4AF5A]/5 text-[#E5C989] text-[11px] font-semibold uppercase tracking-[0.15em] group-hover:bg-[#D4AF5A] group-hover:text-[#0B0B0F] group-hover:border-[#D4AF5A] transition-all">
                        Ver beneficio
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Bottom corner decorations (subtle) */}
                    <div className="pointer-events-none absolute bottom-0 left-0 w-24 h-24 rounded-tr-full bg-gradient-to-tr from-[#D4AF5A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-bl from-[#D4AF5A]/5 to-transparent" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Bottom — Premium */}
      <section className="relative py-16 overflow-hidden" data-testid="benefits-cta">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top, #1a1a24 0%, #0B0B0F 60%)' }} />
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(212,175,90,0.4) 0, transparent 40%), radial-gradient(circle at 75% 75%, rgba(212,175,90,0.2) 0, transparent 40%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF5A]/50 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-[#D4AF5A]/25 blur-2xl" />
            <img src={CLUB_LOGO} alt="Kuxtal Club" className="relative h-16 w-auto mx-auto drop-shadow-[0_10px_30px_rgba(212,175,90,0.3)]" />
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF5A]/30 bg-[#D4AF5A]/5 text-[#E5C989] text-[10px] font-bold uppercase tracking-[0.22em] mb-4">
            <Sparkles className="w-3 h-3" /> Únete al club
          </span>
          <h3
            className="font-heading text-2xl sm:text-3xl font-black mb-3 leading-tight"
            style={{
              background: 'linear-gradient(92deg, #B8944A 0%, #F5E6B8 50%, #D4AF5A 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ¿Eres comercio y quieres unirte?
          </h3>
          <p className="text-sm text-[#F4EBD0]/55 italic tracking-wide mb-7 max-w-md mx-auto">
            Registra tu comercio como aliado de Kuxtal Club y accede a una comunidad exclusiva de clientes
          </p>
          <Link to="/partners/afiliar">
            <Button
              className="rounded-full px-8 h-12 text-sm font-bold uppercase tracking-[0.15em] border border-[#D4AF5A]/40 shadow-[0_10px_30px_-10px_rgba(212,175,90,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(212,175,90,0.8)] transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #F5E6B8 0%, #D4AF5A 50%, #B8944A 100%)', color: '#0B0B0F' }}
              data-testid="register-commerce-btn"
            >
              <Store className="w-4 h-4 mr-2" /> Registrar mi Comercio
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
