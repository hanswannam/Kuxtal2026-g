import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, MapPin, Phone, Gift, Store, ArrowRight, Star } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BenefitsPage() {
  const [searchParams] = useSearchParams();
  const [commerces, setCommerces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');

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

  const categoryIcons = {
    'Restaurantes': '🍽️', 'Mascotas': '🐾', 'Hospitales': '🏥', 'Servicios': '🔧',
    'Belleza': '💆', 'Deportes': '🏋️', 'Tecnología': '💻', 'Educación': '📚',
    'Moda Mujer': '👗', 'Moda Hombre': '👔', 'Hogar': '🏠', 'Entretenimiento': '🎭'
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary/20" data-testid="benefits-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Exclusivo para Socios</p>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Beneficios en Comercios
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Como socio Kuxtal Travel, disfruta descuentos y beneficios exclusivos en comercios aliados
          </p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap justify-center mb-8" data-testid="category-filters">
          <Button
            variant={category === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory('')}
            className="rounded-full"
          >
            Todos
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
              className="rounded-full"
              data-testid={`cat-${cat}`}
            >
              <span className="mr-1">{categoryIcons[cat] || '🏪'}</span> {cat}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar comercio..."
              className="pl-10 rounded-full"
              data-testid="commerce-search"
            />
          </div>
        </div>

        {/* Commerce Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border animate-pulse">
                <div className="h-16 w-16 bg-muted rounded-xl mb-4" />
                <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-8 bg-muted rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : commerces.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">Sin comercios disponibles</h3>
            <p className="text-muted-foreground text-sm">Pronto agregaremos más comercios aliados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {commerces.map((c, i) => (
              <Link
                key={c._id}
                to={`/commerce/${c._id}`}
                className="trip-card group bg-white rounded-2xl p-6 border border-border opacity-0 animate-fade-in-up"
                data-testid={`commerce-card-${i}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover rounded-xl" /> : (categoryIcons[c.category] || '🏪')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">{c.name}</h3>
                    <Badge variant="secondary" className="rounded-full text-xs mt-1">{c.category}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
                {c.benefit_description && (
                  <div className="p-3 bg-accent/60 rounded-xl mb-3">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <Gift className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-2">{c.benefit_description}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
