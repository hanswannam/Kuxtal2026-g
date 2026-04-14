import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Store, Gift, Users, BarChart3, Plus, Trash2, Calendar, Star, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const ax = axios.create({ baseURL: `${API}/api`, withCredentials: true });

export default function CommercePortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [commerce, setCommerce] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [visits, setVisits] = useState([]);
  const [scratchCard, setScratchCard] = useState(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [showScratchForm, setShowScratchForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ title: '', description: '', image_url: '', start_date: '', end_date: '', status: 'active' });
  const [scratchForm, setScratchForm] = useState({ front_image_url: '', prize_image_url: '', lose_image_url: '', prize_text: 'Ganaste un premio', lose_text: 'Sigue intentando', frequency_type: 'percentage', frequency_value: 20, active: true });

  const commerceId = user?.commerce_id || user?.commerce?._id;

  const loadData = useCallback(async () => {
    if (!commerceId) return;
    try {
      const [c, p, v, s] = await Promise.all([
        ax.get(`/commerce/${commerceId}`),
        ax.get(`/commerce/${commerceId}/promotions`),
        ax.get(`/commerce/${commerceId}/visits`),
        ax.get(`/commerce/${commerceId}/scratch-card`),
      ]);
      setCommerce(c.data);
      setPromotions(p.data);
      setVisits(v.data);
      setScratchCard(s.data);
    } catch (e) { console.error(e); }
  }, [commerceId]);

  useEffect(() => { loadData(); }, [loadData]);

  const savePromo = async (e) => {
    e.preventDefault();
    await ax.post(`/commerce/${commerceId}/promotions`, promoForm);
    toast.success('Promoción creada');
    setShowPromoForm(false);
    setPromoForm({ title: '', description: '', image_url: '', start_date: '', end_date: '', status: 'active' });
    loadData();
  };

  const deletePromo = async (promoId) => {
    await ax.delete(`/commerce/${commerceId}/promotions/${promoId}`);
    toast.success('Promoción eliminada');
    loadData();
  };

  const saveScratchCard = async (e) => {
    e.preventDefault();
    await ax.post(`/commerce/${commerceId}/scratch-card`, { ...scratchForm, frequency_value: Number(scratchForm.frequency_value) });
    toast.success('Raspable creado');
    setShowScratchForm(false);
    loadData();
  };

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Store },
    { id: 'promotions', label: 'Promociones', icon: Gift },
    { id: 'scratch', label: 'Raspable', icon: Star },
    { id: 'visits', label: 'Visitas', icon: Users },
  ];

  if (!commerceId) return <div className="min-h-screen pt-24 flex items-center justify-center"><p>No tienes un comercio asignado</p></div>;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary/20" data-testid="commerce-portal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{commerce?.name || 'Mi Comercio'}</h1>
          <p className="text-sm text-muted-foreground">Portal de administración de comercio</p>
        </div>

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-border mb-6 overflow-x-auto" data-testid="commerce-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              data-testid={`commerce-tab-${t.id}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && commerce && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent"><Gift className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-2xl font-bold">{promotions.length}</p><p className="text-xs text-muted-foreground">Promociones</p></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent"><Users className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-2xl font-bold">{visits.length}</p><p className="text-xs text-muted-foreground">Visitas Totales</p></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent"><Star className="w-5 h-5 text-amber-500" /></div>
                  <div><p className="text-2xl font-bold">{scratchCard ? 'Activo' : 'Inactivo'}</p><p className="text-xs text-muted-foreground">Raspable</p></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h2 className="font-heading text-lg font-semibold mb-3">Información del Comercio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Categoría:</span> <span className="font-medium ml-2">{commerce.category}</span></div>
                <div><span className="text-muted-foreground">Ubicación:</span> <span className="font-medium ml-2">{commerce.location}</span></div>
                <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium ml-2">{commerce.phone}</span></div>
                <div><span className="text-muted-foreground">Código Validación:</span> <span className="font-mono font-bold ml-2 text-primary">{commerce.validation_code}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Promotions */}
        {tab === 'promotions' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-semibold">Promociones</h2>
              <Button onClick={() => setShowPromoForm(true)} className="rounded-full" data-testid="add-promo-btn"><Plus className="w-4 h-4 mr-2" /> Nueva Promoción</Button>
            </div>
            <div className="space-y-3">
              {promotions.map((p, i) => (
                <div key={p._id} className="bg-white rounded-2xl p-5 border border-border flex justify-between items-start" data-testid={`commerce-promo-${i}`}>
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" /> {p.start_date} - {p.end_date}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deletePromo(p._id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            {showPromoForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="promo-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Nueva Promoción</h3>
                  <form onSubmit={savePromo} className="space-y-3">
                    <div><Label className="text-xs">Título</Label><Input value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="promo-title" /></div>
                    <div><Label className="text-xs">Descripción</Label><Textarea value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})} className="rounded-xl mt-1" data-testid="promo-desc" /></div>
                    <div><Label className="text-xs">URL Imagen</Label><Input value={promoForm.image_url} onChange={e => setPromoForm({...promoForm, image_url: e.target.value})} className="rounded-xl mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Inicio</Label><Input type="date" value={promoForm.start_date} onChange={e => setPromoForm({...promoForm, start_date: e.target.value})} required className="rounded-xl mt-1" data-testid="promo-start" /></div>
                      <div><Label className="text-xs">Fin</Label><Input type="date" value={promoForm.end_date} onChange={e => setPromoForm({...promoForm, end_date: e.target.value})} required className="rounded-xl mt-1" data-testid="promo-end" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowPromoForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="promo-submit">Crear</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scratch Card */}
        {tab === 'scratch' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-semibold">Raspable Digital</h2>
              <Button onClick={() => setShowScratchForm(true)} className="rounded-full" data-testid="create-scratch-btn"><Plus className="w-4 h-4 mr-2" /> {scratchCard ? 'Actualizar' : 'Crear'} Raspable</Button>
            </div>
            {scratchCard ? (
              <div className="bg-white rounded-2xl p-6 border border-border" data-testid="scratch-config">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Texto Premio:</span> <span className="font-medium ml-2">{scratchCard.prize_text}</span></div>
                  <div><span className="text-muted-foreground">Texto No Premio:</span> <span className="font-medium ml-2">{scratchCard.lose_text}</span></div>
                  <div><span className="text-muted-foreground">Tipo Frecuencia:</span> <span className="font-medium ml-2">{scratchCard.frequency_type === 'percentage' ? 'Porcentaje' : 'Cada X intentos'}</span></div>
                  <div><span className="text-muted-foreground">Valor:</span> <span className="font-medium ml-2">{scratchCard.frequency_value}{scratchCard.frequency_type === 'percentage' ? '%' : ' intentos'}</span></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin raspable activo</h3>
                <p className="text-sm text-muted-foreground">Crea un raspable para atraer más clientes</p>
              </div>
            )}
            {showScratchForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="scratch-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Configurar Raspable</h3>
                  <form onSubmit={saveScratchCard} className="space-y-3">
                    <div><Label className="text-xs">Texto al Ganar</Label><Input value={scratchForm.prize_text} onChange={e => setScratchForm({...scratchForm, prize_text: e.target.value})} className="rounded-xl mt-1" data-testid="scratch-prize-text" /></div>
                    <div><Label className="text-xs">Texto al Perder</Label><Input value={scratchForm.lose_text} onChange={e => setScratchForm({...scratchForm, lose_text: e.target.value})} className="rounded-xl mt-1" data-testid="scratch-lose-text" /></div>
                    <div>
                      <Label className="text-xs">Tipo de Frecuencia</Label>
                      <select value={scratchForm.frequency_type} onChange={e => setScratchForm({...scratchForm, frequency_type: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="scratch-freq-type">
                        <option value="percentage">Porcentaje de ganadores</option>
                        <option value="after_attempts">Cada X intentos</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">{scratchForm.frequency_type === 'percentage' ? 'Porcentaje (%)' : 'Cada cuántos intentos'}</Label>
                      <Input type="number" value={scratchForm.frequency_value} onChange={e => setScratchForm({...scratchForm, frequency_value: e.target.value})} className="rounded-xl mt-1" data-testid="scratch-freq-value" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowScratchForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="scratch-submit">Guardar</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visits */}
        {tab === 'visits' && (
          <div className="animate-fade-in" data-testid="commerce-visits">
            <h2 className="font-heading text-lg font-semibold mb-4">Visitas de Clientes ({visits.length})</h2>
            {visits.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin visitas registradas</h3>
                <p className="text-sm text-muted-foreground">Las visitas validadas aparecerán aquí</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr><th className="text-left p-3 font-medium">Cliente</th><th className="text-left p-3 font-medium">Fecha</th></tr>
                  </thead>
                  <tbody>
                    {visits.map((v, i) => (
                      <tr key={v._id} className="border-t border-border">
                        <td className="p-3">{v.user_name}</td>
                        <td className="p-3 text-muted-foreground">{new Date(v.validated_at).toLocaleString('es')}</td>
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
