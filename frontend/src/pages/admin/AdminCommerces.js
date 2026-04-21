import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Upload, Search, X, Store, MapPin, Facebook, Instagram, Twitter, Youtube, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import api from '../../lib/api';

export function AdminCommerces({ commerces, commerceForm, setCommerceForm, showCommerceForm, setShowCommerceForm, commerceCategories, saveCommerce, deleteCommerce, handleImageUpload, uploading }) {
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState(commerceCategories);

  React.useEffect(() => { setLocalCategories(commerceCategories); }, [commerceCategories]);

  const locations = useMemo(() => Array.from(new Set(commerces.map(c => c.location).filter(Boolean))).sort(), [commerces]);
  const [locationFilter, setLocationFilter] = useState('');

  const norm = (s) => (s || '').toString().toLowerCase();
  const filtered = commerces.filter(c => {
    if (catFilter && c.category !== catFilter) return false;
    if (locationFilter && c.location !== locationFilter) return false;
    if (q.trim()) {
      const n = norm(q);
      if (!norm(c.name).includes(n) && !norm(c.description).includes(n) && !norm(c.location).includes(n) && !norm(c.validation_code).includes(n)) return false;
    }
    return true;
  });

  const addNewCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await api.post('/commerce/categories', { name });
      toast.success('Categoría creada');
      setLocalCategories(prev => prev.includes(name) ? prev : [...prev, name]);
      setCommerceForm(f => ({ ...f, category: name }));
      setNewCategory('');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear categoría');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Comercios ({filtered.length}{filtered.length !== commerces.length ? ` de ${commerces.length}` : ''})</h2>
        <Button onClick={() => window.location.href = '/admin/new-commerce'} className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" data-testid="add-commerce-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Comercio
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-3 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2" data-testid="commerce-filters">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, ubicación..." className="pl-9 rounded-xl" data-testid="commerce-search" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="commerce-filter-category">
          <option value="">Todas las categorías</option>
          {localCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="commerce-filter-location">
          <option value="">Todas las ubicaciones</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center" data-testid="commerce-empty">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No se encontraron comercios con los filtros aplicados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <div key={c._id} className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-all" data-testid={`admin-commerce-${i}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <Badge variant="secondary" className="rounded-full text-xs mt-1">{c.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setCommerceForm({...c}); setShowCommerceForm(true); }} className="text-primary" data-testid={`edit-commerce-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                  <DeleteWithCode onConfirm={(code) => deleteCommerce(c._id, code)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{c.description}</p>
              <p className="text-xs text-muted-foreground">{c.location}</p>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">{c.validation_code}</span>
                <span className="text-[10px] text-muted-foreground select-all">ID: {c._id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCommerceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="commerce-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-4">{commerceForm._id ? 'Editar Comercio' : 'Nuevo Comercio'}</h3>
            <form onSubmit={saveCommerce} className="space-y-3">
              <div><Label className="text-xs">Nombre</Label><Input value={commerceForm.name} onChange={e => setCommerceForm({...commerceForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="cf-name" /></div>
              <div><Label className="text-xs">Descripción</Label><Textarea value={commerceForm.description} onChange={e => setCommerceForm({...commerceForm, description: e.target.value})} className="rounded-xl mt-1" data-testid="cf-desc" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categoría</Label>
                  <select value={commerceForm.category} onChange={e => setCommerceForm({...commerceForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="cf-category">
                    {localCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div><Label className="text-xs">Ubicación</Label><Input value={commerceForm.location} onChange={e => setCommerceForm({...commerceForm, location: e.target.value})} className="rounded-xl mt-1" data-testid="cf-location" /></div>
              </div>
              <div className="bg-secondary/40 rounded-xl p-3 border border-border" data-testid="cf-new-category-block">
                <Label className="text-xs font-semibold">¿Categoría nueva?</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ej: Farmacia, Spa, Librería" className="rounded-xl flex-1" data-testid="cf-new-category-input" />
                  <Button type="button" onClick={addNewCategory} disabled={!newCategory.trim()} className="rounded-xl" data-testid="cf-new-category-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">La nueva categoría se guardará y estará disponible para todos los comercios.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Teléfono</Label><Input value={commerceForm.phone} onChange={e => setCommerceForm({...commerceForm, phone: e.target.value})} className="rounded-xl mt-1" data-testid="cf-phone" /></div>
                <div><Label className="text-xs">Email</Label><Input value={commerceForm.email} onChange={e => setCommerceForm({...commerceForm, email: e.target.value})} className="rounded-xl mt-1" data-testid="cf-email" /></div>
              </div>
              <div><Label className="text-xs">Beneficio para Socios</Label><Textarea value={commerceForm.benefit_description} onChange={e => setCommerceForm({...commerceForm, benefit_description: e.target.value})} placeholder="Ej: 20% de descuento en consumo" className="rounded-xl mt-1" data-testid="cf-benefit" /></div>
              <div>
                <Label className="text-xs">Logo (URL o subir imagen)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={commerceForm.logo_url || ''} onChange={e => setCommerceForm({...commerceForm, logo_url: e.target.value})} placeholder="https://... o sube imagen" className="rounded-xl" data-testid="cf-logo" />
                  <label className="shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setCommerceForm({...commerceForm, logo_url: url}))} />
                    <Button type="button" variant="outline" size="sm" className="rounded-xl h-10" disabled={uploading} asChild><span><Upload className="w-4 h-4" /></span></Button>
                  </label>
                </div>
                {commerceForm.logo_url && <img src={commerceForm.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover mt-2 border" />}
              </div>
              <div><Label className="text-xs">Sitio Web</Label><Input value={commerceForm.website || ''} onChange={e => setCommerceForm({...commerceForm, website: e.target.value})} placeholder="https://www.micomercio.com" className="rounded-xl mt-1" data-testid="cf-website" /></div>

              {/* Dirección & mapas */}
              <div className="pt-3 border-t border-border">
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección y mapas</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Dirección completa</Label>
                    <Input value={commerceForm.address || ''} onChange={e => setCommerceForm({...commerceForm, address: e.target.value})} placeholder="Ej: 5a Av. 10-25 Zona 10, Guatemala" className="rounded-xl mt-1" data-testid="cf-address" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Google Maps URL</Label>
                      <Input value={commerceForm.google_maps_url || ''} onChange={e => setCommerceForm({...commerceForm, google_maps_url: e.target.value})} placeholder="https://maps.app.goo.gl/..." className="rounded-xl mt-1" data-testid="cf-maps" />
                    </div>
                    <div>
                      <Label className="text-xs">Waze URL</Label>
                      <Input value={commerceForm.waze_url || ''} onChange={e => setCommerceForm({...commerceForm, waze_url: e.target.value})} placeholder="https://waze.com/ul?..." className="rounded-xl mt-1" data-testid="cf-waze" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Redes sociales */}
              <div className="pt-3 border-t border-border">
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Redes sociales</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                    <Input value={commerceForm.social_facebook || ''} onChange={e => setCommerceForm({...commerceForm, social_facebook: e.target.value})} placeholder="https://facebook.com/..." className="rounded-xl" data-testid="cf-facebook" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                    <Input value={commerceForm.social_instagram || ''} onChange={e => setCommerceForm({...commerceForm, social_instagram: e.target.value})} placeholder="https://instagram.com/..." className="rounded-xl" data-testid="cf-instagram" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-4 text-center shrink-0">TT</span>
                    <Input value={commerceForm.social_tiktok || ''} onChange={e => setCommerceForm({...commerceForm, social_tiktok: e.target.value})} placeholder="https://tiktok.com/@..." className="rounded-xl" data-testid="cf-tiktok" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-sky-500 shrink-0" />
                    <Input value={commerceForm.social_twitter || ''} onChange={e => setCommerceForm({...commerceForm, social_twitter: e.target.value})} placeholder="https://x.com/..." className="rounded-xl" data-testid="cf-twitter" />
                  </div>
                </div>
              </div>

              {/* Video + galería */}
              <div className="pt-3 border-t border-border">
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1"><Youtube className="w-3 h-3" /> Multimedia</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Video YouTube (URL)</Label>
                    <Input value={commerceForm.youtube_video || ''} onChange={e => setCommerceForm({...commerceForm, youtube_video: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="rounded-xl mt-1" data-testid="cf-youtube" />
                  </div>
                  <div>
                    <Label className="text-xs">Galería de fotos</Label>
                    {Array.isArray(commerceForm.photos) && commerceForm.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2" data-testid="cf-photos-grid">
                        {commerceForm.photos.map((ph, idx) => (
                          <div key={idx} className="relative group">
                            <img src={ph} alt={`foto ${idx + 1}`} className="w-full h-20 rounded-lg object-cover border" />
                            <button
                              type="button"
                              onClick={() => setCommerceForm({...commerceForm, photos: commerceForm.photos.filter((_, i) => i !== idx)})}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`cf-photo-remove-${idx}`}
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="mt-2 block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e, url => setCommerceForm({...commerceForm, photos: [...(commerceForm.photos || []), url]}))}
                      />
                      <Button type="button" variant="outline" size="sm" className="rounded-xl w-full mt-1" disabled={uploading} asChild>
                        <span><Upload className="w-4 h-4 mr-2" /> Agregar foto</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              <div><Label className="text-xs">Código de Validación</Label><Input value={commerceForm.validation_code} onChange={e => setCommerceForm({...commerceForm, validation_code: e.target.value.toUpperCase()})} placeholder="Ej: MICOMERCIO01" className="rounded-xl mt-1 font-mono" data-testid="cf-code" /></div>

              <div>
                <Label className="text-xs">Estado</Label>
                <select
                  value={commerceForm.status || 'active'}
                  onChange={e => setCommerceForm({...commerceForm, status: e.target.value})}
                  className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm"
                  data-testid="cf-status"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCommerceForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="cf-submit">{commerceForm._id ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
