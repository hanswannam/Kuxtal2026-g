import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Building2, MapPin, Gift, Edit, X, Upload, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { DeleteWithCode } from '../../components/DeleteWithCode';

export function AdminClubs({ handleImageUpload, uploading }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', logo_url: '', description: '', address: '', benefits: [] });
  const [benefitInput, setBenefitInput] = useState('');

  useEffect(() => { loadClubs(); }, []);

  const loadClubs = async () => {
    try { const { data } = await api.get('/clubs'); setClubs(data); } catch (e) { console.error('Failed to load clubs:', e); }
    setLoading(false);
  };

  const saveClub = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/clubs/${editing._id}`, form);
        toast.success('Club actualizado');
      } else {
        await api.post('/clubs', form);
        toast.success('Club creado');
      }
      setShowForm(false); setEditing(null);
      setForm({ name: '', logo_url: '', description: '', address: '', benefits: [] });
      loadClubs();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  const editClub = (c) => { setForm({...c}); setEditing(c); setShowForm(true); };
  const deleteClub = async (id, code) => { await api.delete(`/clubs/${id}?delete_code=${encodeURIComponent(code)}`); loadClubs(); toast.success('Club eliminado'); };
  const addBenefit = () => { if (benefitInput.trim()) { setForm({...form, benefits: [...form.benefits, benefitInput.trim()]}); setBenefitInput(''); } };

  return (
    <div className="animate-fade-in" data-testid="admin-clubs">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Clubs Vacacionales ({clubs.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', logo_url: '', description: '', address: '', benefits: [] }); }} className="rounded-full" data-testid="add-club-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Club
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></div>
      ) : clubs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin clubs vacacionales</h3>
          <p className="text-sm text-muted-foreground">Crea clubs con sus beneficios para los socios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((c, i) => (
            <div key={c._id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all" data-testid={`club-card-${i}`}>
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1">{c.name}</h3>
                    {c.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.address}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => editClub(c)} data-testid={`edit-club-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                    <DeleteWithCode onConfirm={(code) => deleteClub(c._id, code)} />
                  </div>
                </div>
                {c.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>}
                {c.benefits?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Beneficios</p>
                    {c.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-accent-foreground shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="club-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-4">{editing ? 'Editar Club' : 'Nuevo Club Vacacional'}</h3>
            <form onSubmit={saveClub} className="space-y-3">
              <div><Label className="text-xs">Nombre del Club</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ej: Kuxtal Travels Premium" className="rounded-xl mt-1" data-testid="clf-name" /></div>
              <div>
                <Label className="text-xs">Logo (URL o subir)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={form.logo_url || ''} onChange={e => setForm({...form, logo_url: e.target.value})} placeholder="URL del logo" className="rounded-xl" data-testid="clf-logo" />
                  <label className="shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setForm({...form, logo_url: url}))} />
                    <Button type="button" variant="outline" size="sm" className="rounded-xl h-10" disabled={uploading} asChild><span><Upload className="w-4 h-4" /></span></Button>
                  </label>
                </div>
                {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover mt-2 border" />}
              </div>
              <div><Label className="text-xs">Descripción</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl mt-1" data-testid="clf-desc" /></div>
              <div><Label className="text-xs">Dirección</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Dirección del club" className="rounded-xl mt-1" data-testid="clf-address" /></div>
              <div>
                <Label className="text-xs">Beneficios</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={benefitInput} onChange={e => setBenefitInput(e.target.value)} placeholder="Ej: Acceso a piscina" className="rounded-xl" onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addBenefit();}}} data-testid="clf-benefit-input" />
                  <Button type="button" onClick={addBenefit} size="sm" className="rounded-xl">+</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(form.benefits || []).map((b, idx) => (
                    <span key={b} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs">
                      {b}<button type="button" onClick={() => setForm({...form, benefits: form.benefits.filter((_, i) => i !== idx)})}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="clf-submit">{editing ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
