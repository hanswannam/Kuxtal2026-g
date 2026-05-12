import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Search, MapPin, Star, Calendar, X, SlidersHorizontal, Package, Hotel, Compass,
  Users, ArrowUpDown, ArrowRight, Sparkles,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CountdownTimer } from '../components/CountdownTimer';
import ImageWithFallback from '../components/ImageWithFallback';

const API = process.env.REACT_APP_BACKEND_URL;

// Luxury Magazine palette (matches HomePage / TripDetailPage)
const NAVY = '#0D2B45';
const NAVY_DEEP = '#061829';
const GOLD = '#D4AF5A';
const CHAMPAGNE = '#E5C989';
const SERIF = '"Playfair Display", Georgia, serif';

const CATEGORIES = [
  { id: '', label: 'Todos', icon: Search },
  { id: 'paquete', label: 'Paquetes', icon: Package },
  { id: 'alojamiento', label: 'Alojamientos', icon: Hotel },
  { id: 'experiencia', label: 'Experiencias', icon: Compass },
];

const SORT_OPTIONS = [
  { id: '', label: 'Recomendados' },
  { id: 'price_asc', label: 'Precio: Menor a Mayor' },
  { id: 'price_desc', label: 'Precio: Mayor a Menor' },
  { id: 'duration_asc', label: 'Duración: Corta' },
  { id: 'duration_desc', label: 'Duración: Larga' },
  { id: 'rating', label: 'Mejor Calificación' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  useDocumentTitle('Buscar Destinos');

  useEffect(() => {
    axios.get(`${API}/api/countries`).then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (country) params.set('country', country);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    axios.get(`${API}/api/packages?${params.toString()}`).then(r => {
      setPackages(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, category, country, sort, minPrice, maxPrice]);

  const clearFilters = () => {
    setSearch(''); setCategory(''); setCountry(''); setSort(''); setMinPrice(''); setMaxPrice('');
    setSearchParams({});
  };

  const hasFilters = search || category || country || minPrice || maxPrice;

  return (
    <div
      className="min-h-screen pt-20 relative"
      style={{ background: 'linear-gradient(180deg, #FAF8F3 0%, #F3EEE2 50%, #FAF8F3 100%)' }}
      data-testid="search-page"
    >
      {/* Subtle gold marble veins on the whole page */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 15% 15%, ${GOLD} 0, transparent 40%), radial-gradient(ellipse at 85% 80%, ${GOLD} 0, transparent 40%)`,
        }}
      />

      {/* ══════ SEARCH / FILTER HEADER — luxury cream ══════ */}
      <div
        className="sticky top-16 z-30 backdrop-blur-md"
        style={{
          background: 'rgba(250,248,243,0.92)',
          borderBottom: `1px solid ${GOLD}33`,
          boxShadow: '0 1px 20px -10px rgba(13,43,69,0.12)',
        }}
      >
        {/* Gold hairline on top */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}88, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-[2]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GOLD }} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar destinos, paquetes, experiencias…"
                className="pl-11 h-12 rounded-full border-0 text-sm"
                style={{
                  background: '#FFFFFF',
                  color: NAVY,
                  boxShadow: `inset 0 0 0 1px ${GOLD}55, 0 2px 10px -4px rgba(13,43,69,0.1)`,
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                }}
                data-testid="search-input"
              />
            </div>
            {/* Country Select */}
            <div className="relative flex-1 sm:max-w-[220px]">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: GOLD }} />
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-full border-0 text-sm appearance-none cursor-pointer font-semibold"
                style={{
                  background: '#FFFFFF',
                  color: NAVY,
                  boxShadow: `inset 0 0 0 1px ${GOLD}55, 0 2px 10px -4px rgba(13,43,69,0.1)`,
                }}
                data-testid="search-country-select"
              >
                <option value="">Todos los países</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Filter toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full h-12 px-6 shrink-0 font-bold text-xs uppercase tracking-[0.18em] transition-all"
              style={showFilters ? {
                background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                color: NAVY_DEEP,
                border: `1px solid ${GOLD}`,
                boxShadow: `0 8px 20px -6px rgba(212,175,90,0.5)`,
              } : {
                background: '#FFFFFF',
                color: NAVY,
                border: `1px solid ${GOLD}66`,
              }}
              data-testid="toggle-filters-btn"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
            </Button>
          </div>

          {/* Category Tabs — navy pills with gold active */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap transition-all"
                  style={active ? {
                    background: NAVY,
                    color: CHAMPAGNE,
                    boxShadow: `0 6px 18px -6px rgba(13,43,69,0.5), inset 0 0 0 1px ${GOLD}88`,
                  } : {
                    background: 'transparent',
                    color: `${NAVY}aa`,
                    border: `1px solid ${NAVY}22`,
                  }}
                  data-testid={`filter-cat-${cat.id || 'all'}`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div
              className="mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in"
              style={{ borderTop: `1px solid ${GOLD}33` }}
              data-testid="expanded-filters"
            >
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block" style={{ color: '#8B6F2E' }}>
                  Precio mínimo (Q.)
                </label>
                <Input
                  type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"
                  className="h-10 rounded-lg text-sm bg-white border-0"
                  style={{ boxShadow: `inset 0 0 0 1px ${GOLD}44`, color: NAVY }}
                  data-testid="filter-min-price"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block" style={{ color: '#8B6F2E' }}>
                  Precio máximo (Q.)
                </label>
                <Input
                  type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="50,000"
                  className="h-10 rounded-lg text-sm bg-white border-0"
                  style={{ boxShadow: `inset 0 0 0 1px ${GOLD}44`, color: NAVY }}
                  data-testid="filter-max-price"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block" style={{ color: '#8B6F2E' }}>
                  Ordenar por
                </label>
                <select
                  value={sort} onChange={e => setSort(e.target.value)}
                  className="w-full h-10 rounded-lg px-3 text-sm bg-white border-0 cursor-pointer font-semibold"
                  style={{ boxShadow: `inset 0 0 0 1px ${GOLD}44`, color: NAVY }}
                  data-testid="filter-sort"
                >
                  {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors hover:opacity-70"
                    style={{ color: NAVY }}
                    data-testid="clear-filters-btn"
                  >
                    <X className="w-3 h-3" /> Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════ RESULTS ══════ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Results header — editorial */}
        <div className="flex items-end justify-between mb-10 sm:mb-14 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 sm:w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em]" style={{ color: '#8B6F2E' }}>
                La colección Kuxtal
              </p>
            </div>
            <h1 className="font-heading text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight leading-[0.95]" style={{ color: NAVY }}>
              {search ? (
                <>
                  Resultados para{' '}
                  <span className="italic font-semibold" style={{ fontFamily: SERIF, background: `linear-gradient(92deg, ${GOLD} 0%, #B8944A 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    "{search}"
                  </span>
                </>
              ) : country ? (
                <>
                  Destinos en{' '}
                  <span className="italic font-semibold" style={{ fontFamily: SERIF, background: `linear-gradient(92deg, ${GOLD} 0%, #B8944A 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    {country}
                  </span>
                </>
              ) : (
                <>
                  Todos los{' '}
                  <span className="italic font-semibold" style={{ fontFamily: SERIF, background: `linear-gradient(92deg, ${GOLD} 0%, #B8944A 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    destinos
                  </span>
                </>
              )}
            </h1>
            <p className="mt-3 text-sm italic" style={{ color: `${NAVY}88`, fontFamily: SERIF }}>
              {packages.length} {packages.length === 1 ? 'experiencia encontrada' : 'experiencias encontradas'}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 px-5 py-3 rounded-full" style={{ background: '#FFFFFF', border: `1px solid ${GOLD}55`, boxShadow: '0 2px 10px -4px rgba(13,43,69,0.1)' }}>
            <ArrowUpDown className="w-4 h-4" style={{ color: GOLD }} />
            <select
              value={sort} onChange={e => setSort(e.target.value)}
              className="text-xs font-bold uppercase tracking-[0.18em] border-0 bg-transparent cursor-pointer focus:outline-none"
              style={{ color: NAVY }}
              data-testid="sort-select-inline"
            >
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Loading — luxury skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="rounded-[22px] overflow-hidden animate-pulse"
                style={{ background: '#FFFFFF', boxShadow: `0 8px 24px -12px rgba(13,43,69,0.15), 0 0 0 1px ${GOLD}22` }}
              >
                <div className="aspect-[4/5]" style={{ background: `${GOLD}15` }} />
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ background: `${GOLD}20` }} />
                  <div className="h-px" style={{ background: `${GOLD}30` }} />
                  <div className="h-3 rounded w-full" style={{ background: `${GOLD}15` }} />
                  <div className="h-3 rounded w-2/3" style={{ background: `${GOLD}15` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid — identical luxury magazine cards as HomePage */}
        {!loading && packages.length > 0 && (
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
                data-testid={`search-result-${i}`}
              >
                {/* Top gold hairline on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
                />

                {/* Editorial 4:5 image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <ImageWithFallback
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Category badge — navy deep */}
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

                  {/* Featured badge — gold metallic */}
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

                  {/* Price pill — gold metallic */}
                  <div className="absolute bottom-4 right-4">
                    <div
                      className="px-4 py-2 rounded-xl text-base font-black backdrop-blur-sm"
                      style={{
                        background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                        color: NAVY_DEEP,
                        boxShadow: `0 8px 20px -6px rgba(212,175,90,0.55)`,
                        border: `1px solid ${GOLD}cc`,
                        fontFamily: SERIF,
                      }}
                    >
                      Q.{pkg.price?.toLocaleString()}
                    </div>
                  </div>

                  {/* Member price — navy ribbon bottom-left */}
                  {pkg.member_price > 0 && (
                    <div className="absolute bottom-4 left-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm"
                        style={{
                          background: `${NAVY_DEEP}ee`,
                          color: CHAMPAGNE,
                          border: `1px solid ${GOLD}66`,
                        }}
                        data-testid="member-special-badge"
                      >
                        <Sparkles className="w-2.5 h-2.5" style={{ color: GOLD }} />
                        Precio especial para socios
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6">
                  {/* Rating + duration */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" style={{ color: GOLD, fill: GOLD }} />
                      <span className="text-sm font-black" style={{ color: NAVY }}>{pkg.rating}</span>
                      <span className="text-xs" style={{ color: `${NAVY}55` }}>/5</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NAVY}77` }}>
                      <Calendar className="w-3 h-3" style={{ color: GOLD }} />
                      {pkg.duration_days} días
                    </span>
                  </div>

                  {/* Gold hairline */}
                  <div className="h-px mb-3 opacity-40" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />

                  {/* Title */}
                  <h3
                    className="font-heading text-xl font-bold mb-2 line-clamp-1 transition-all duration-300"
                    style={{ color: NAVY }}
                  >
                    {pkg.title}
                  </h3>

                  {/* Description — italic serif */}
                  <p
                    className="text-sm line-clamp-2 mb-4 italic leading-relaxed"
                    style={{ color: `${NAVY}88`, fontFamily: SERIF }}
                  >
                    {pkg.short_description || pkg.description}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${GOLD}22` }}>
                    <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: NAVY }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      <span>{pkg.country}</span>
                      {pkg.max_group && (
                        <span className="inline-flex items-center gap-1 ml-3 text-[10px]" style={{ color: `${NAVY}66` }}>
                          <Users className="w-3 h-3" />
                          {pkg.min_group || 1}-{pkg.max_group}
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all group-hover:gap-3"
                      style={{ color: GOLD }}
                    >
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
        )}

        {/* No results — editorial empty state */}
        {!loading && packages.length === 0 && (
          <div className="text-center py-24 sm:py-32 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8" style={{ background: '#FFFFFF', border: `1px solid ${GOLD}66`, boxShadow: `0 8px 24px -8px rgba(212,175,90,0.3)` }}>
              <Search className="w-8 h-8" style={{ color: GOLD }} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}aa)` }} />
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#8B6F2E' }}>Sin coincidencias</p>
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${GOLD}aa, transparent)` }} />
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-black mb-4" style={{ color: NAVY }}>
              No encontramos{' '}
              <span className="italic font-semibold" style={{ fontFamily: SERIF, background: `linear-gradient(92deg, ${GOLD} 0%, #B8944A 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                resultados
              </span>
            </h2>
            <p className="italic text-base mb-8 max-w-md mx-auto" style={{ color: `${NAVY}88`, fontFamily: SERIF }}>
              Intenta con otros términos de búsqueda o ajusta los filtros para descubrir más experiencias curadas.
            </p>
            <Button
              onClick={clearFilters}
              size="lg"
              className="rounded-full px-10 h-12 font-bold text-xs uppercase tracking-[0.22em] transition-all hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, #F5E6B8 0%, ${GOLD} 50%, #B8944A 100%)`,
                color: NAVY_DEEP,
                border: `1px solid ${GOLD}`,
                boxShadow: `0 15px 40px -10px rgba(212,175,90,0.5)`,
              }}
              data-testid="no-results-clear"
            >
              <X className="w-4 h-4 mr-2" /> Limpiar filtros y ver todo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
