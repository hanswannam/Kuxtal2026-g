import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Gift, Calendar, Check, X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import { CountdownTimer } from '../../components/CountdownTimer';

export function AdminRegalias({ members, handleImageUpload, uploading }) {
  const [regalias, setRegalias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', image_url: '', member_id: '', member_name: '', start_date: '', end_date: '' });

  useEffect(() => { loadRegalias(); }, []);

  const loadRegalias = async () => {
    try { const { data } = await api.get('/regalias'); setRegalias(data); } catch (e) { console.error('Failed to load regalias:', e); }
    setLoading(false);
  };

  const saveRegalia = async (e) => {
    e.preventDefault();
    try {
      const selectedMember = members.find(m => m._id === form.member_id);
      await api.post('/regalias', { ...form, member_name: selectedMember?.name || form.member_name });
      toast.success('Regalia creada');
      setShowForm(false);
      setForm({ name: '', image_url: '', member_id: '', member_name: '', start_date: '', end_date: '' });
      loadRegalias();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  const toggleUsed = async (id) => {
    try { await api.put(`/regalias/${id}/toggle-used`); loadRegalias(); toast.success('Estado actualizado'); } catch (e) { toast.error('Error'); }
  };

  const deleteRegalia = async (id, code) => {
    await api.delete(`/regalias/${id}?delete_code=${encodeURIComponent(code)}`);
    loadRegalias();
    toast.success('Regalia eliminada');
  };

  const isExpired = (endDate) => endDate && new Date(endDate) < new Date();

  return (
    <div className="animate-fade-in" data-testid="admin-regalias">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Regalias ({regalias.length})</h2>
        <Button onClick={() => setShowForm(true)} className="rounded-full" data-testid="add-regalia-btn">
          <Plus className="w-4 h-4 mr-2" /> Nueva Regalia
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></div>
      ) : regalias.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin regalias</h3>
          <p className="text-sm text-muted-foreground">Crea certificados y regalias para los socios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regalias.map((r, i) => (
            <div key={r._id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${r.used ? 'border-border opacity-70' : isExpired(r.end_date) ? 'border-destructive/30' : 'border-primary/20'}`} data-testid={`regalia-card-${i}`}>
              {r.image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.member_name || 'Sin socio asignado'}</p>
                  </div>
                  <div className="flex gap-1">
                    {r.used ? (
                      <Badge variant="secondary" className="rounded-full text-xs">Usada</Badge>
                    ) : isExpired(r.end_date) ? (
                      <Badge variant="destructive" className="rounded-full text-xs">Vencida</Badge>
                    ) : (
                      <Badge className="rounded-full text-xs bg-primary text-white">Activa</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {r.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.start_date).toLocaleDateString('es')}</span>}
                  {r.end_date && <span>- {new Date(r.end_date).toLocaleDateString('es')}</span>}
                </div>
                {r.end_date && !r.used && (
                  <div className="mb-3">
                    <CountdownTimer endDate={r.end_date} compact />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant={r.used ? 'secondary' : 'default'} onClick={() => toggleUsed(r._id)} className="flex-1 rounded-lg text-xs" data-testid={`toggle-regalia-${i}`}>
                    {r.used ? <X className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                    {r.used ? 'Marcar No Usada' : 'Marcar Usada'}
                  </Button>
                  <DeleteWithCode onConfirm={(code) => deleteRegalia(r._id, code)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="regalia-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-xl font-semibold mb-4">Nueva Regalia</h3>
            <form onSubmit={saveRegalia} className="space-y-3">
              <div><Label className="text-xs">Nombre de la Regalia</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ej: Certificado de bienvenida" className="rounded-xl mt-1" data-testid="rf-name" /></div>
              <div>
                <Label className="text-xs">Imagen (URL o subir)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="URL de la imagen" className="rounded-xl" data-testid="rf-image" />
                  <label className="shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setForm({...form, image_url: url}))} />
                    <Button type="button" variant="outline" size="sm" className="rounded-xl h-10" disabled={uploading} asChild><span><Upload className="w-4 h-4" /></span></Button>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-xs">Socio</Label>
                <select value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="rf-member">
                  <option value="">Seleccionar socio...</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.contract_number})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Fecha Inicio</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="rounded-xl mt-1" data-testid="rf-start" /></div>
                <div><Label className="text-xs">Fecha Vencimiento</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="rounded-xl mt-1" data-testid="rf-end" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="rf-submit">Crear Regalia</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
