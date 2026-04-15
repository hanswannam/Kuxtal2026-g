import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Store, Gift, Users, Plus, Trash2, Calendar, Star, Edit, Save,
  Play, Image, MapPin, Phone, Globe, Facebook, Instagram, Youtube,
  X, ExternalLink, Sparkles, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const API = process.env.REACT_APP_BACKEND_URL;
const ax = api;

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function CommercePortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [commerce, setCommerce] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [visits, setVisits] = useState([]);
  const [scratchCard, setScratchCard] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [showScratchForm, setShowScratchForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ title: '', description: '', image_url: '', start_date: '', end_date: '', status: 'active' });
  const [scratchForm, setScratchForm] = useState({ prize_text: 'Ganaste un premio', lose_text: 'Sigue intentando', frequency_type: 'percentage', frequency_value: 20, active: true });
  const [uploading, setUploading] = useState(false);

  const commerceId = user?.commerce_id || user?.commerce?._id;

  const loadData = useCallback(async () => {
    if (!commerceId) return;
    try {
      const [c, p, v, s] = await Promise.all([
        ax.get(`/commerce/${commerceId}`), ax.get(`/commerce/${commerceId}/promotions`),
        ax.get(`/commerce/${commerceId}/visits`), ax.get(`/commerce/${commerceId}/scratch-card`),
      ]);
      setCommerce(c.data); setPromotions(p.data); setVisits(v.data); setScratchCard(s.data);
    } catch (e) { console.error(e); }
  }, [commerceId]);

  useEffect(() => { loadData(); }, [loadData]);

  const startEditing = () => { setEditForm({ ...commerce }); setEditing(true); };
  const cancelEditing = () => { setEditing(false); };
  const saveEditing = async () => {
    try {
      await ax.put(`/commerce/${commerceId}`, editForm);
      toast.success('Comercio actualizado');
      setEditing(false);
      loadData();
    } catch (e) { toast.error('Error al guardar'); }
  };

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

  const addPhoto = (url) => { setEditForm({ ...editForm, photos: [...(editForm.photos || []), url] }); };
  const removePhoto = (idx) => { setEditForm({ ...editForm, photos: (editForm.photos || []).filter((_, i) => i !== idx) }); };

  const savePromo = async (e) => { e.preventDefault(); await ax.post(`/commerce/${commerceId}/promotions`, promoForm); toast.success('Promoción creada'); setShowPromoForm(false); setPromoForm({ title: '', description: '', image_url: '', start_date: '', end_date: '', status: 'active' }); loadData(); };
  const deletePromo = async (id) => { await ax.delete(`/commerce/${commerceId}/promotions/${id}`); toast.success('Eliminada'); loadData(); };
  const saveScratchCard = async (e) => { e.preventDefault(); await ax.post(`/commerce/${commerceId}/scratch-card`, { ...scratchForm, frequency_value: Number(scratchForm.frequency_value) }); toast.success('Raspable configurado'); setShowScratchForm(false); loadData(); };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: Store },
    { id: 'promotions', label: 'Promociones', icon: Gift },
    { id: 'scratch', label: 'Raspable', icon: Sparkles },
    { id: 'visits', label: 'Visitas', icon: Users },
  ];

  if (!commerceId) return <div className="min-h-screen pt-24 flex items-center justify-center"><p>No tienes un comercio asignado</p></div>;

  const embedUrl = commerce ? getYoutubeEmbedUrl(commerce.youtube_video) : null;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary/20" data-testid="commerce-portal">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{commerce?.name || 'Mi Comercio'}</h1>
            <p className="text-sm text-muted-foreground">Portal de administración</p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary border-0 px-3 hidden sm:flex">{commerce?.category}</Badge>
        </div>

        {/* Tabs - attractive pill buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" data-testid="commerce-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                tab === t.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white text-muted-foreground border border-border hover:border-primary/30 hover:text-primary hover:shadow-md'
              }`}
              data-testid={`commerce-tab-${t.id}`}>
              <t.icon className="w-5 h-5" /> {t.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab === 'profile' && commerce && (
          <div className="space-y-6 animate-fade-in">
            {/* Edit button */}
            <div className="flex justify-end">
              {!editing ? (
                <Button onClick={startEditing} className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" data-testid="edit-commerce-btn">
                  <Edit className="w-4 h-4 mr-2" /> Editar Perfil
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={cancelEditing} variant="outline" className="rounded-full">Cancelar</Button>
                  <Button onClick={saveEditing} className="rounded-full bg-primary hover:bg-primary/90" data-testid="save-commerce-btn"><Save className="w-4 h-4 mr-2" /> Guardar</Button>
                </div>
              )}
            </div>

            {/* YouTube Video */}
            <div className="bg-white rounded-2xl overflow-hidden border border-border" data-testid="commerce-video">
              {editing ? (
                <div className="p-5">
                  <Label className="text-sm font-semibold flex items-center gap-2 mb-2"><Youtube className="w-4 h-4 text-red-500" /> Video de YouTube</Label>
                  <Input value={editForm.youtube_video || ''} onChange={e => setEditForm({...editForm, youtube_video: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="rounded-xl" data-testid="edit-youtube" />
                </div>
              ) : embedUrl ? (
                <div className="aspect-video">
                  <iframe src={embedUrl} title="Video del comercio" className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : (
                <div className="aspect-video bg-secondary/50 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Play className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Agrega un video de YouTube desde "Editar Perfil"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Photos Grid */}
            <div className="bg-white rounded-2xl p-5 border border-border" data-testid="commerce-photos">
              <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Fotos del Comercio</h3>
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(editForm.photos || []).map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {(editForm.photos || []).length < 4 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, addPhoto)} />
                        <Plus className="w-8 h-8 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">{uploading ? 'Subiendo...' : 'Agregar'}</span>
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(commerce.photos || []).length > 0 ? commerce.photos.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  )) : (
                    <div className="col-span-4 py-8 text-center text-muted-foreground">
                      <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin fotos. Haz clic en "Editar Perfil" para agregar</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 border border-border" data-testid="commerce-description">
              <h3 className="font-heading text-lg font-semibold mb-3">Descripción</h3>
              {editing ? (
                <Textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="rounded-xl" data-testid="edit-description" />
              ) : (
                <p className="text-foreground/80 leading-relaxed">{commerce.description || 'Sin descripción'}</p>
              )}
              {commerce.benefit_description && !editing && (
                <div className="mt-4 p-4 bg-accent/50 rounded-xl flex items-center gap-3">
                  <Gift className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-primary font-semibold mb-0.5">Beneficio para socios</p>
                    <p className="text-sm">{commerce.benefit_description}</p>
                  </div>
                </div>
              )}
              {editing && (
                <div className="mt-3">
                  <Label className="text-xs font-semibold">Beneficio para socios</Label>
                  <Input value={editForm.benefit_description || ''} onChange={e => setEditForm({...editForm, benefit_description: e.target.value})} className="rounded-xl mt-1" data-testid="edit-benefit" />
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl p-5 border border-border" data-testid="commerce-social">
              <h3 className="font-heading text-lg font-semibold mb-4">Redes Sociales</h3>
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2"><Facebook className="w-5 h-5 text-blue-600 shrink-0" /><Input value={editForm.social_facebook || ''} onChange={e => setEditForm({...editForm, social_facebook: e.target.value})} placeholder="Facebook URL" className="rounded-xl" /></div>
                  <div className="flex items-center gap-2"><Instagram className="w-5 h-5 text-pink-600 shrink-0" /><Input value={editForm.social_instagram || ''} onChange={e => setEditForm({...editForm, social_instagram: e.target.value})} placeholder="Instagram URL" className="rounded-xl" /></div>
                  <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-muted-foreground shrink-0" /><Input value={editForm.social_tiktok || ''} onChange={e => setEditForm({...editForm, social_tiktok: e.target.value})} placeholder="TikTok URL" className="rounded-xl" /></div>
                  <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-sky-500 shrink-0" /><Input value={editForm.social_twitter || ''} onChange={e => setEditForm({...editForm, social_twitter: e.target.value})} placeholder="Twitter/X URL" className="rounded-xl" /></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {[
                    { url: commerce.social_facebook, icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' },
                    { url: commerce.social_instagram, icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200' },
                    { url: commerce.social_tiktok, icon: Globe, label: 'TikTok', color: 'hover:bg-slate-50 hover:text-slate-700 hover:border-slate-200' },
                    { url: commerce.social_twitter, icon: Globe, label: 'X/Twitter', color: 'hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200' },
                  ].filter(s => s.url).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium transition-all ${s.color}`}>
                      <s.icon className="w-4 h-4" /> {s.label} <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  ))}
                  {!commerce.social_facebook && !commerce.social_instagram && !commerce.social_tiktok && !commerce.social_twitter && (
                    <p className="text-sm text-muted-foreground">Sin redes sociales configuradas</p>
                  )}
                </div>
              )}
            </div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-border" data-testid="commerce-location">
                <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Ubicación</h3>
                {editing ? (
                  <div className="space-y-2">
                    <Input value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="Ciudad, Zona" className="rounded-xl" />
                    <Input value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Dirección completa" className="rounded-xl" data-testid="edit-address" />
                    <div>
                      <Label className="text-xs flex items-center gap-1 mb-1"><Navigation className="w-3 h-3" /> Link Google Maps</Label>
                      <Input value={editForm.google_maps_url || ''} onChange={e => setEditForm({...editForm, google_maps_url: e.target.value})} placeholder="https://maps.google.com/..." className="rounded-xl" data-testid="edit-gmaps" />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1 mb-1"><Navigation className="w-3 h-3" /> Link Waze</Label>
                      <Input value={editForm.waze_url || ''} onChange={e => setEditForm({...editForm, waze_url: e.target.value})} placeholder="https://waze.com/ul/..." className="rounded-xl" data-testid="edit-waze" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{commerce.location || 'Sin ubicación'}</p>
                      {commerce.address && <p className="text-sm text-muted-foreground mt-1">{commerce.address}</p>}
                    </div>
                    {(commerce.google_maps_url || commerce.waze_url) && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {commerce.google_maps_url && (
                          <a href={commerce.google_maps_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium hover:bg-blue-100 hover:shadow-md transition-all hover:-translate-y-0.5"
                            data-testid="gmaps-btn">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            Google Maps
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        )}
                        {commerce.waze_url && (
                          <a href={commerce.waze_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-sm font-medium hover:bg-sky-100 hover:shadow-md transition-all hover:-translate-y-0.5"
                            data-testid="waze-btn">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 2.3.8 4.4 2.1 6.1l-.7 2.5 2.6-.7C7.6 21.2 9.7 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm-1 6c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm4 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-5 7c-1.1 0-2-.4-2.8-1.1l1.4-1.4c.4.3.9.5 1.4.5s1-.2 1.4-.5l1.4 1.4C11.9 14.6 11 15 10 15z"/></svg>
                            Waze
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        )}
                      </div>
                    )}
                    {!commerce.google_maps_url && !commerce.waze_url && !commerce.location && (
                      <p className="text-sm text-muted-foreground">Agrega tu ubicación desde "Editar Perfil"</p>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border" data-testid="commerce-contact">
                <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Contacto</h3>
                {editing ? (
                  <div className="space-y-2">
                    <Input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Teléfono" className="rounded-xl" />
                    <Input value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" className="rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {commerce.phone && (
                      <a href={`tel:${commerce.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors">
                        <Phone className="w-5 h-5" /> <span className="font-medium">{commerce.phone}</span>
                      </a>
                    )}
                    {commerce.email && <p className="text-sm text-muted-foreground">{commerce.email}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Validation Code */}
            <div className="bg-white rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Código de Validación</p>
                  <p className="font-mono font-bold text-2xl text-primary">{commerce.validation_code}</p>
                </div>
                <p className="text-xs text-muted-foreground max-w-[200px] text-right">Este código lo ingresan los socios cuando visitan tu comercio</p>
              </div>
            </div>
          </div>
        )}

        {/* PROMOTIONS TAB */}
        {tab === 'promotions' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-semibold">Promociones</h2>
              <Button onClick={() => setShowPromoForm(true)} className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" data-testid="add-promo-btn"><Plus className="w-4 h-4 mr-2" /> Nueva Promoción</Button>
            </div>
            {promotions.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-border text-center">
                <Gift className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin promociones activas</h3>
                <p className="text-sm text-muted-foreground mb-4">Crea tu primera promoción para atraer más socios</p>
                <Button onClick={() => setShowPromoForm(true)} className="rounded-full bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Crear Promoción</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {promotions.map((p, i) => (
                  <div key={p._id} className="bg-white rounded-2xl overflow-hidden border border-border group hover:shadow-lg transition-all" data-testid={`commerce-promo-${i}`}>
                    {p.image_url && <div className="aspect-video overflow-hidden"><img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{p.title}</h3>
                        <Button size="sm" variant="ghost" onClick={() => deletePromo(p._id)} className="text-destructive shrink-0"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> {p.start_date} - {p.end_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showPromoForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="promo-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Nueva Promoción</h3>
                  <form onSubmit={savePromo} className="space-y-3">
                    <div><Label className="text-xs">Título</Label><Input value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="promo-title" /></div>
                    <div><Label className="text-xs">Descripción</Label><Textarea value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})} className="rounded-xl mt-1" /></div>
                    <div><Label className="text-xs">URL Imagen</Label><Input value={promoForm.image_url} onChange={e => setPromoForm({...promoForm, image_url: e.target.value})} className="rounded-xl mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Inicio</Label><Input type="date" value={promoForm.start_date} onChange={e => setPromoForm({...promoForm, start_date: e.target.value})} required className="rounded-xl mt-1" /></div>
                      <div><Label className="text-xs">Fin</Label><Input type="date" value={promoForm.end_date} onChange={e => setPromoForm({...promoForm, end_date: e.target.value})} required className="rounded-xl mt-1" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowPromoForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90">Crear</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCRATCH TAB */}
        {tab === 'scratch' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-semibold">Raspable Digital</h2>
              <Button onClick={() => setShowScratchForm(true)} className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" data-testid="create-scratch-btn"><Sparkles className="w-4 h-4 mr-2" /> {scratchCard ? 'Actualizar' : 'Crear'}</Button>
            </div>
            {scratchCard ? (
              <div className="bg-white rounded-2xl p-6 border border-border">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-accent/50 rounded-xl text-center"><p className="text-xs text-muted-foreground mb-1">Premio</p><p className="font-semibold text-sm">{scratchCard.prize_text}</p></div>
                  <div className="p-4 bg-secondary rounded-xl text-center"><p className="text-xs text-muted-foreground mb-1">No premio</p><p className="font-semibold text-sm">{scratchCard.lose_text}</p></div>
                  <div className="p-4 bg-accent/50 rounded-xl text-center"><p className="text-xs text-muted-foreground mb-1">Tipo</p><p className="font-semibold text-sm">{scratchCard.frequency_type === 'percentage' ? 'Porcentaje' : 'Cada X intentos'}</p></div>
                  <div className="p-4 bg-primary/10 rounded-xl text-center"><p className="text-xs text-muted-foreground mb-1">Valor</p><p className="font-bold text-xl text-primary">{scratchCard.frequency_value}{scratchCard.frequency_type === 'percentage' ? '%' : ''}</p></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 border border-border text-center">
                <Sparkles className="w-14 h-14 text-amber-400/40 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin raspable activo</h3>
                <p className="text-sm text-muted-foreground">Crea un juego de raspa y gana para tus clientes</p>
              </div>
            )}
            {showScratchForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Configurar Raspable</h3>
                  <form onSubmit={saveScratchCard} className="space-y-3">
                    <div><Label className="text-xs">Texto al Ganar</Label><Input value={scratchForm.prize_text} onChange={e => setScratchForm({...scratchForm, prize_text: e.target.value})} className="rounded-xl mt-1" /></div>
                    <div><Label className="text-xs">Texto al Perder</Label><Input value={scratchForm.lose_text} onChange={e => setScratchForm({...scratchForm, lose_text: e.target.value})} className="rounded-xl mt-1" /></div>
                    <div><Label className="text-xs">Tipo de Frecuencia</Label>
                      <select value={scratchForm.frequency_type} onChange={e => setScratchForm({...scratchForm, frequency_type: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm">
                        <option value="percentage">Porcentaje de ganadores</option><option value="after_attempts">Cada X intentos</option>
                      </select></div>
                    <div><Label className="text-xs">{scratchForm.frequency_type === 'percentage' ? 'Porcentaje (%)' : 'Cada cuántos intentos'}</Label><Input type="number" value={scratchForm.frequency_value} onChange={e => setScratchForm({...scratchForm, frequency_value: e.target.value})} className="rounded-xl mt-1" /></div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowScratchForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90">Guardar</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISITS TAB */}
        {tab === 'visits' && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-xl font-semibold mb-6">Visitas ({visits.length})</h2>
            {visits.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-border text-center">
                <Users className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin visitas</h3>
                <p className="text-sm text-muted-foreground">Las visitas validadas por socios aparecerán aquí</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50"><tr><th className="text-left p-4 font-semibold">Cliente</th><th className="text-left p-4 font-semibold">Fecha</th></tr></thead>
                  <tbody>
                    {visits.map((v, i) => (
                      <tr key={v._id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                        <td className="p-4 font-medium">{v.user_name}</td>
                        <td className="p-4 text-muted-foreground">{new Date(v.validated_at).toLocaleString('es')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
