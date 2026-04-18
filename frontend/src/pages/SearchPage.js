import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, MapPin, Star, Calendar, Filter, X, SlidersHorizontal, Package, Hotel, Compass, Users, ArrowUpDown } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API = process.env.REACT_APP_BACKEND_URL;

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
  { id: 'duration_asc', label: 'Duracion: Corta' },
  { id: 'duration_desc', label: 'Duracion: Larga' },
  { id: 'rating', label: 'Mejor Calificacion' },
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
    <div className="min-h-screen pt-20 bg-secondary/20" data-testid="search-page">
      {/* Search Header */}
      <div className="bg-white border-b border-border shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-[2]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar destinos, paquetes, experiencias..."
                className="pl-10 h-11 rounded-xl"
                data-testid="search-input"
              />
            </div>
            {/* Country Select */}
            <div className="relative flex-1 sm:max-w-[200px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-input text-sm appearance-none cursor-pointer bg-white"
                data-testid="search-country-select"
              >
                <option value="">Todos los paises</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl h-11 shrink-0 ${showFilters ? 'text-white border-transparent' : ''}`}
              style={showFilters ? {backgroundColor: '#1B325F'} : {}}
              data-testid="toggle-filters-btn"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                style={category === cat.id ? {backgroundColor: '#1B325F'} : {}}
                data-testid={`filter-cat-${cat.id || 'all'}`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in" data-testid="expanded-filters">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Precio minimo (Q.)</label>
                <Input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" className="h-9 rounded-lg text-sm" data-testid="filter-min-price" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Precio maximo (Q.)</label>
                <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="50,000" className="h-9 rounded-lg text-sm" data-testid="filter-max-price" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Ordenar por</label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="w-full h-9 rounded-lg border border-input px-3 text-sm" data-testid="filter-sort">
                  {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive rounded-lg" data-testid="clear-filters-btn">
                    <X className="w-3 h-3 mr-1" /> Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold" style={{color: '#1B325F'}}>
              {search ? `Resultados para "${search}"` : country ? `Destinos en ${country}` : 'Todos los Destinos'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{packages.length} {packages.length === 1 ? 'resultado' : 'resultados'} encontrados</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border-0 bg-transparent font-medium cursor-pointer" data-testid="sort-select-inline">
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <Link
                key={pkg._id}
                to={`/trip/${pkg._id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                data-testid={`search-result-${i}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pkg.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold">
                      {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-3 py-1.5 backdrop-blur-sm text-white rounded-lg text-sm font-bold" style={{backgroundColor: 'rgba(27,50,95,0.85)'}}>
                      Q.{pkg.price?.toLocaleString()}
                    </span>
                  </div>
                  {pkg.member_price > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 text-white rounded-lg text-[10px] font-semibold" style={{backgroundColor: '#99D63B', color: '#1B325F'}}>
                        Socio: Q.{pkg.member_price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{pkg.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{pkg.duration_days} dias</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-1 transition-colors line-clamp-1" style={{color: '#1B325F'}}>
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {pkg.short_description || pkg.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" style={{color: '#99D63B'}} />
                      <span>{pkg.country}</span>
                    </div>
                    {pkg.max_group && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{pkg.min_group || 1}-{pkg.max_group}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && packages.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h2 className="font-heading text-2xl font-semibold mb-3">No encontramos resultados</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Intenta con otros terminos de busqueda o ajusta los filtros para ver mas opciones
            </p>
            <Button onClick={clearFilters} variant="outline" className="rounded-full" data-testid="no-results-clear">
              <X className="w-4 h-4 mr-2" /> Limpiar filtros y ver todo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
