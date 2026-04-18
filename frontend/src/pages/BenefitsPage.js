import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, MapPin, Phone, Gift, Store, Star, Heart, Shield, Globe, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API = process.env.REACT_APP_BACKEND_URL;
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png";

const CATEGORY_CONFIG = {
  'Restaurantes': { icon: Store, color: 'from-orange-500 to-orange-600', light: 'bg-orange-50 text-orange-600 border-orange-200', accent: 'text-orange-500' },
  'Belleza': { icon: Heart, color: 'from-pink-500 to-pink-600', light: 'bg-pink-50 text-pink-600 border-pink-200', accent: 'text-pink-500' },
  'Deportes': { icon: Shield, color: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600 border-emerald-200', accent: 'text-emerald-500' },
  'Mascotas': { icon: Gift, color: 'from-amber-500 to-amber-600', light: 'bg-amber-50 text-amber-600 border-amber-200', accent: 'text-amber-500' },
  'Hospitales': { icon: Globe, color: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600 border-blue-200', accent: 'text-blue-500' },
  'Entretenimiento': { icon: Star, color: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-600 border-violet-200', accent: 'text-violet-500' },
  'Servicios': { icon: Sparkles, color: 'from-slate-500 to-slate-600', light: 'bg-slate-50 text-slate-600 border-slate-200', accent: 'text-slate-500' },
  'Tecnología': { icon: Globe, color: 'from-cyan-500 to-cyan-600', light: 'bg-cyan-50 text-cyan-600 border-cyan-200', accent: 'text-cyan-500' },
  'Educación': { icon: Star, color: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-600 border-indigo-200', accent: 'text-indigo-500' },
  'Moda Mujer': { icon: Heart, color: 'from-rose-500 to-rose-600', light: 'bg-rose-50 text-rose-600 border-rose-200', accent: 'text-rose-500' },
  'Moda Hombre': { icon: Shield, color: 'from-sky-500 to-sky-600', light: 'bg-sky-50 text-sky-600 border-sky-200', accent: 'text-sky-500' },
  'Hogar': { icon: Store, color: 'from-teal-500 to-teal-600', light: 'bg-teal-50 text-teal-600 border-teal-200', accent: 'text-teal-500' },
};

function getCatConfig(cat) {
  return CATEGORY_CONFIG[cat] || { icon: Store, color: 'from-gray-500 to-gray-600', light: 'bg-gray-50 text-gray-600 border-gray-200', accent: 'text-gray-500' };
}

export default function BenefitsPage() {
  const [searchParams] = useSearchParams();
  const [commerces, setCommerces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  useDocumentTitle('Kuxtal Club - Beneficios');

  useEffect(() => {
    axios.get(`${API}/api/commerce/categories`).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    axios.get(`${API}/api/commerce?${params.toString()}`).then(r => { setCommerces(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [search, category]);

  const activeCatConfig = category ? getCatConfig(category) : null;

  return (
    <div className="min-h-screen" data-testid="benefits-page">
      {/* Hero Header */}
      <section className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#1a0a0a]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col items-center text-center sm:text-left sm:items-start gap-4 mb-8">
            <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-16 sm:h-20 w-auto" data-testid="benefits-club-logo" />
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Comercios <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">Aliados</span>
              </h1>
              <p className="text-white/50 mt-2 text-xs sm:text-sm max-w-lg mx-auto sm:mx-0">
                Descuentos y beneficios exclusivos en los mejores comercios de Guatemala para socios Kuxtal
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto sm:mx-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar comercio, categoria o beneficio..."
                className="pl-12 h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:bg-white/15 focus:border-amber-400/50"
                data-testid="commerce-search"
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-6" data-testid="category-filters">
            <button
              onClick={() => setCategory('')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                category === '' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
              }`}
              data-testid="cat-all"
            >
              Todos
            </button>
            {categories.map(cat => {
              const conf = getCatConfig(cat);
              const CatIcon = conf.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all truncate ${
                    category === cat ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                  }`}
                  data-testid={`cat-${cat}`}
                >
                  <CatIcon className="w-3.5 h-3.5" /> {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Category Banner */}
      {category && activeCatConfig && (
        <div className={`bg-gradient-to-r ${activeCatConfig.color} py-3`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <activeCatConfig.icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{category}</span>
              <span className="text-white/70 text-sm">- {commerces.length} comercios</span>
            </div>
            <button onClick={() => setCategory('')} className="text-white/70 hover:text-white text-xs font-medium">
              Ver todos
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <section className="py-10 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Cargando...' : `${commerces.length} ${commerces.length === 1 ? 'comercio' : 'comercios'} encontrados`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="h-3 bg-gradient-to-r from-primary/20 to-primary/5" />
                  <div className="p-5 space-y-3">
                    <div className="flex gap-3"><div className="w-14 h-14 bg-muted rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-1/3" /></div></div>
                    <div className="h-12 bg-muted rounded-xl" />
                    <div className="h-3 bg-muted rounded w-1/2" />
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
                {category ? `No hay comercios en la categoria "${category}"` : 'Pronto agregaremos mas comercios aliados'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {commerces.map((c, i) => {
                const conf = getCatConfig(c.category);
                return (
                  <Link
                    key={c._id}
                    to={`/commerce/${c._id}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    data-testid={`commerce-card-${i}`}
                  >
                    {/* Color accent bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${conf.color}`} />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shrink-0 overflow-hidden border border-border">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <conf.icon className={`w-7 h-7 ${conf.accent}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">{c.name}</h3>
                          <Badge className={`rounded-full text-[10px] mt-1 border ${conf.light}`}>{c.category}</Badge>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </div>

                      {/* Description */}
                      {c.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
                      )}

                      {/* Benefit */}
                      {c.benefit_description && (
                        <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl mb-3 border border-amber-100">
                          <div className="flex items-start gap-2">
                            <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-amber-800 line-clamp-2">{c.benefit_description}</span>
                          </div>
                        </div>
                      )}

                      {/* Promotions Count */}
                      {c.promotions && c.promotions.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-semibold text-primary">{c.promotions.length} {c.promotions.length === 1 ? 'promocion activa' : 'promociones activas'}</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                        {c.location && (
                          <span className="flex items-center gap-1 line-clamp-1"><MapPin className="w-3 h-3 shrink-0" /> {c.location}</span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" /> {c.phone}</span>
                        )}
                        {c.website && (
                          <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3 shrink-0" /> Web</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-12 bg-white border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-14 w-auto mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">¿Eres comercio y quieres unirte?</h3>
          <p className="text-sm text-muted-foreground mb-5">Registra tu comercio como aliado de Kuxtal Club y atrae clientes exclusivos</p>
          <Link to="/admin/new-commerce">
            <Button className="rounded-full bg-primary hover:bg-primary/90 px-8" data-testid="register-commerce-btn">
              <Store className="w-4 h-4 mr-2" /> Registrar mi Comercio
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
