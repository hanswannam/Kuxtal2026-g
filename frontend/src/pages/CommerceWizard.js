import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Store, ArrowRight, ArrowLeft, Check, Upload, MapPin, Phone, Mail,
  Globe, Gift, Facebook, Instagram, Youtube, Image, Sparkles, Plus, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const API = process.env.REACT_APP_BACKEND_URL;
const ax = api;

const DEFAULT_CATEGORIES = [
  'Restaurantes', 'Mascotas', 'Hospitales', 'Servicios',
  'Belleza', 'Deportes', 'Tecnología', 'Educación',
  'Moda Mujer', 'Moda Hombre', 'Hogar', 'Entretenimiento'
];

const CATEGORY_ICONS = {
  'Restaurantes': '🍽️', 'Mascotas': '🐾', 'Hospitales': '🏥', 'Servicios': '🔧',
  'Belleza': '💆', 'Deportes': '🏋️', 'Tecnología': '💻', 'Educación': '📚',
  'Moda Mujer': '👗', 'Moda Hombre': '👔', 'Hogar': '🏠', 'Entretenimiento': '🎭'
};

const STEPS = [
  { id: 'info', title: '¿Cómo se llama tu comercio?', subtitle: 'Nombre y categoría' },
  { id: 'logo', title: 'Logo del comercio', subtitle: 'Sube el logo o imagen principal' },
  { id: 'description', title: 'Cuéntanos sobre tu comercio', subtitle: 'Descripción y beneficio para socios' },
  { id: 'photos', title: 'Fotos del comercio', subtitle: 'Hasta 4 fotos de tu negocio' },
  { id: 'video', title: 'Video de YouTube', subtitle: 'Enlace de un video de tu negocio (opcional)' },
  { id: 'location', title: '¿Dónde se ubica?', subtitle: 'Dirección y enlaces de navegación' },
  { id: 'contact', title: 'Datos de contacto', subtitle: 'Teléfono, email y sitio web' },
  { id: 'social', title: 'Redes sociales', subtitle: 'Enlaces a tus redes (opcional)' },
  { id: 'review', title: 'Revisa y confirma', subtitle: 'Verifica que todo esté correcto' },
];

export default function CommerceWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES.map(n => ({ name: n, icon: CATEGORY_ICONS[n] || '🏷️', system: true })));
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    api.get('/commerce/categories?full=true').then(r => {
      if (Array.isArray(r.data) && r.data.length) {
        setCategories(r.data);
      }
    }).catch(() => {});
  }, []);

  const createCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setCreatingCat(true);
    try {
      const res = await api.post('/commerce/categories', { name, icon: '🏷️' });
      const newCat = { name: res.data.name, icon: res.data.icon, system: false };
      setCategories(prev => prev.some(c => c.name === name) ? prev : [...prev, newCat]);
      setForm(f => ({ ...f, category: name }));
      setNewCatName('');
      setShowNewCatInput(false);
      toast.success(`Categoría "${name}" creada`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear categoría');
    }
    setCreatingCat(false);
  };

  const [form, setForm] = useState({
    name: '', category: 'Restaurantes', description: '', benefit_description: '',
    logo_url: '', photos: [], youtube_video: '',
    location: '', address: '', google_maps_url: '', waze_url: '',
    phone: '', email: '', website: '',
    social_facebook: '', social_instagram: '', social_tiktok: '', social_twitter: '',
    validation_code: '', status: 'active'
  });

  const handleImageUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await ax.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      callback(`${API}/api/files/${data.path}`);
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir imagen'); }
    setUploading(false);
  };

  const canGoNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    return true;
  };

  const next = () => { if (step < STEPS.length - 1 && canGoNext()) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await ax.post('/commerce', form);
      toast.success(`Comercio "${form.name}" creado correctamente`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear comercio');
    }
    setSaving(false);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary/20" data-testid="commerce-wizard">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Paso {step + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step Title */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{STEPS[step].title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{STEPS[step].subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-6 border border-border mb-6 animate-fade-in">

          {/* STEP 0: Name & Category */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium">Nombre del comercio</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: La Parrilla Gaucha" className="mt-1.5 h-12 rounded-xl text-lg" autoFocus data-testid="wiz-name" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-3 block">Categoría</Label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const isImgIcon = cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/'));
                    return (
                      <button type="button" key={cat.name} onClick={() => setForm({...form, category: cat.name})}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-xs font-medium ${
                          form.category === cat.name ? 'border-primary bg-accent text-primary scale-[1.02] shadow-sm' : 'border-border hover:border-primary/30'
                        }`} data-testid={`wiz-cat-${cat.name}`}>
                        {isImgIcon
                          ? <img src={cat.icon} alt={cat.name} className="w-6 h-6 object-contain" />
                          : <span className="text-xl">{cat.icon || CATEGORY_ICONS[cat.name] || '🏷️'}</span>
                        }
                        <span className="leading-tight text-center">{cat.name}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(true)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all text-xs font-medium"
                    data-testid="wiz-new-category-btn"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="leading-tight text-center">Nueva categoría</span>
                  </button>
                </div>

                {showNewCatInput && (
                  <div className="mt-3 bg-secondary/40 border border-border rounded-xl p-3" data-testid="wiz-new-category-block">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          autoFocus
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCategory(); } }}
                          placeholder="Ej: Farmacia, Spa, Librería"
                          className="pl-9 rounded-xl"
                          data-testid="wiz-new-category-input"
                        />
                      </div>
                      <Button type="button" onClick={createCategory} disabled={!newCatName.trim() || creatingCat} className="rounded-xl" data-testid="wiz-new-category-save">
                        {creatingCat ? 'Guardando...' : 'Crear'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setShowNewCatInput(false); setNewCatName(''); }} className="rounded-xl">
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">La categoría quedará disponible para futuros comercios.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: Logo */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                {form.logo_url ? (
                  <div className="relative">
                    <img src={form.logo_url} alt="Logo" className="w-32 h-32 rounded-2xl object-cover border border-border shadow-sm" />
                    <button onClick={() => setForm({...form, logo_url: ''})} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                  </div>
                ) : (
                  <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setForm({...form, logo_url: url}))} />
                    <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? 'Subiendo...' : 'Subir logo'}</span>
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">O pega un enlace de imagen:</p>
              <Input value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})} placeholder="https://..." className="rounded-xl" data-testid="wiz-logo-url" />
            </div>
          )}

          {/* STEP 2: Description & Benefit */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Descripción del comercio</Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Cuéntanos qué ofrece tu negocio..." rows={4} className="mt-1.5 rounded-xl" data-testid="wiz-desc" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> Beneficio para socios Kuxtal</Label>
                <Input value={form.benefit_description} onChange={e => setForm({...form, benefit_description: e.target.value})} placeholder="Ej: 20% de descuento en consumo" className="mt-1.5 h-12 rounded-xl" data-testid="wiz-benefit" />
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {form.photos.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm({...form, photos: form.photos.filter((_, idx) => idx !== i)})}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
                {form.photos.length < 4 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setForm({...form, photos: [...form.photos, url]}))} />
                    <Image className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? 'Subiendo...' : 'Agregar foto'}</span>
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">{form.photos.length}/4 fotos</p>
            </div>
          )}

          {/* STEP 4: YouTube Video */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" /> Enlace de YouTube</Label>
                <Input value={form.youtube_video} onChange={e => setForm({...form, youtube_video: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="mt-1.5 h-12 rounded-xl" data-testid="wiz-youtube" />
              </div>
              {form.youtube_video && (() => {
                const match = form.youtube_video.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                return match ? (
                  <div className="aspect-video rounded-xl overflow-hidden border border-border">
                    <iframe src={`https://www.youtube.com/embed/${match[1]}`} title="Preview" className="w-full h-full" allowFullScreen />
                  </div>
                ) : <p className="text-xs text-red-500">URL no válida</p>;
              })()}
            </div>
          )}

          {/* STEP 5: Location */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Ciudad / Zona</Label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Ej: Zona 10, Guatemala City" className="mt-1.5 h-12 rounded-xl" data-testid="wiz-location" />
              </div>
              <div>
                <Label className="text-sm font-medium">Dirección completa</Label>
                <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Calle, número, referencia..." className="mt-1.5 rounded-xl" data-testid="wiz-address" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Link de Google Maps</Label>
                <Input value={form.google_maps_url} onChange={e => setForm({...form, google_maps_url: e.target.value})} placeholder="https://maps.google.com/..." className="mt-1.5 rounded-xl" data-testid="wiz-gmaps" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-sky-600" /> Link de Waze</Label>
                <Input value={form.waze_url} onChange={e => setForm({...form, waze_url: e.target.value})} placeholder="https://waze.com/ul/..." className="mt-1.5 rounded-xl" data-testid="wiz-waze" />
              </div>
            </div>
          )}

          {/* STEP 6: Contact */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+502 5555-1234" className="mt-1.5 h-12 rounded-xl" data-testid="wiz-phone" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contacto@micomercio.com" className="mt-1.5 rounded-xl" data-testid="wiz-email" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" /> Sitio web (opcional)</Label>
                <Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://www.micomercio.com" className="mt-1.5 rounded-xl" data-testid="wiz-website" />
              </div>
            </div>
          )}

          {/* STEP 7: Social Media */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook</Label>
                <Input value={form.social_facebook} onChange={e => setForm({...form, social_facebook: e.target.value})} placeholder="https://facebook.com/..." className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-600" /> Instagram</Label>
                <Input value={form.social_instagram} onChange={e => setForm({...form, social_instagram: e.target.value})} placeholder="https://instagram.com/..." className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4" /> TikTok</Label>
                <Input value={form.social_tiktok} onChange={e => setForm({...form, social_tiktok: e.target.value})} placeholder="https://tiktok.com/@..." className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-sky-500" /> X / Twitter</Label>
                <Input value={form.social_twitter} onChange={e => setForm({...form, social_twitter: e.target.value})} placeholder="https://x.com/..." className="mt-1.5 rounded-xl" />
              </div>
            </div>
          )}

          {/* STEP 8: Review */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl">
                {form.logo_url ? <img src={form.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-2xl">{(categories.find(c => c.name === form.category)?.icon) || CATEGORY_ICONS[form.category] || '🏷️'}</div>}
                <div>
                  <h3 className="font-heading text-lg font-bold">{form.name}</h3>
                  <span className="text-xs text-muted-foreground">{form.category}</span>
                </div>
              </div>
              {[
                { label: 'Descripción', value: form.description, show: !!form.description },
                { label: 'Beneficio socios', value: form.benefit_description, show: !!form.benefit_description },
                { label: 'Fotos', value: `${form.photos.length} fotos subidas`, show: form.photos.length > 0 },
                { label: 'Video YouTube', value: form.youtube_video ? 'Configurado' : 'No', show: true },
                { label: 'Ubicación', value: form.location || 'Sin ubicación', show: true },
                { label: 'Google Maps', value: form.google_maps_url ? 'Configurado' : 'No', show: true },
                { label: 'Waze', value: form.waze_url ? 'Configurado' : 'No', show: true },
                { label: 'Teléfono', value: form.phone || 'Sin teléfono', show: true },
                { label: 'Email', value: form.email || 'Sin email', show: true },
              ].filter(r => r.show).map((r) => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{r.value}</span>
                </div>
              ))}
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4" /> El comercio se activará automáticamente al crearlo
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={prev} className="flex-1 h-12 rounded-xl" data-testid="wiz-prev">
              <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canGoNext()} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold" data-testid="wiz-next">
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={saving} className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base font-semibold" data-testid="wiz-submit">
              {saving ? 'Creando...' : 'Crear Comercio'} {!saving && <Sparkles className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
