import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, MapPin, Star, Calendar, Filter, X } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const categories = [
  { value: '', label: 'Todos' },
  { value: 'paquete', label: 'Paquetes' },
  { value: 'alojamiento', label: 'Alojamientos' },
  { value: 'experiencia', label: 'Experiencias' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');

  useEffect(() => {
    axios.get(`${API}/api/countries`).then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (country) params.set('country', country);
    axios.get(`${API}/api/packages?${params.toString()}`).then(r => {
      setPackages(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, category, country]);

  const clearFilters = () => { setSearch(''); setCategory(''); setCountry(''); setSearchParams({}); };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary/20" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Explora Destinos
          </h1>
          <p className="text-muted-foreground">Encuentra tu próxima aventura entre nuestros paquetes exclusivos</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 mb-8 border border-border" data-testid="search-filters">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar destino..."
                className="pl-10 rounded-xl"
                data-testid="search-input"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className="rounded-full text-xs"
                  data-testid={`filter-${cat.value || 'all'}`}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
          {countries.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                <MapPin className="w-3 h-3" /> País:
              </span>
              <Button
                variant={country === '' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCountry('')}
                className="rounded-full text-xs h-7"
              >
                Todos
              </Button>
              {countries.map(c => (
                <Button
                  key={c}
                  variant={country === c ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCountry(c)}
                  className="rounded-full text-xs h-7"
                  data-testid={`country-${c}`}
                >
                  {c}
                </Button>
              ))}
            </div>
          )}
          {(search || category || country) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{packages.length} resultados</span>
              <button onClick={clearFilters} className="text-xs text-primary flex items-center gap-1 hover:underline" data-testid="clear-filters">
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No se encontraron resultados</h3>
            <p className="text-muted-foreground text-sm mb-4">Intenta con otros filtros de búsqueda</p>
            <Button variant="outline" onClick={clearFilters} className="rounded-full">Limpiar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {packages.map((pkg, i) => (
              <Link
                key={pkg._id}
                to={`/trip/${pkg._id}`}
                className="trip-card group bg-white rounded-2xl overflow-hidden border border-border opacity-0 animate-fade-in-up"
                data-testid={`search-trip-card-${i}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pkg.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold">
                      {pkg.category === 'alojamiento' ? 'Alojamiento' : pkg.category === 'experiencia' ? 'Experiencia' : 'Paquete'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium">{pkg.rating}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pkg.short_description || pkg.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {pkg.duration_days} días</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {pkg.country}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Desde</p>
                      <p className="text-xl font-bold text-primary">Q.{pkg.price?.toLocaleString()}</p>
                    </div>
                    <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90">Ver Viaje</Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
