import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit2, Search, X, User } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { DeleteWithCode } from '../../components/DeleteWithCode';

const EMPTY = { name: '', email: '', phone: '', dpi: '', notes: '' };

export function AdminClients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null=hidden, object=show
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/clients${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then(r => setClients(r.data))
      .catch(() => toast.error('Error al cargar clientes'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/clients/${editing._id}`, form);
        toast.success('Cliente actualizado');
      } else {
        await api.post('/clients', form);
        toast.success('Cliente creado');
      }
      setForm(null); setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    }
  };

  const remove = async (id, code) => {
    try {
      await api.delete(`/clients/${id}?delete_code=${encodeURIComponent(code)}`);
      toast.success('Cliente eliminado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  return (
    <div className="animate-fade-in" data-testid="admin-clients">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Clientes ({clients.length})</h2>
          <p className="text-xs text-muted-foreground">Prospectos y clientes no socios. Se registran automáticamente al cotizar.</p>
        </div>
        <Button onClick={() => { setForm({ ...EMPTY }); setEditing(null); }} className="rounded-full" data-testid="cli-add-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-3 mb-4 relative" data-testid="cli-search-wrap">
        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, email, teléfono, DPI..." className="pl-9 rounded-xl" data-testid="cli-search" />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center text-sm text-muted-foreground">Cargando...</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center" data-testid="cli-empty">
          <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No hay clientes con los filtros aplicados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Teléfono</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Origen</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c._id} className="border-t border-border hover:bg-secondary/30 transition-colors" data-testid={`cli-row-${i}`}>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{c.email || '-'}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{c.phone || '-'}</td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="secondary" className="rounded-full text-[10px] font-normal">
                        {c.source === 'quotation' ? 'Cotización' : 'Manual'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setForm({ name: c.name, email: c.email||'', phone: c.phone||'', dpi: c.dpi||'', notes: c.notes||'' }); setEditing(c); }} data-testid={`edit-cli-${i}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <DeleteWithCode onConfirm={(code) => remove(c._id, code)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="cli-form">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <form onSubmit={save} className="space-y-3">
              <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-xl mt-1" data-testid="cli-f-name" /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl mt-1" data-testid="cli-f-email" /></div>
              <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-xl mt-1" data-testid="cli-f-phone" /></div>
              <div><Label className="text-xs">DPI</Label><Input value={form.dpi} onChange={e => setForm({...form, dpi: e.target.value})} className="rounded-xl mt-1" data-testid="cli-f-dpi" /></div>
              <div><Label className="text-xs">Notas</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl mt-1" rows={2} /></div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setForm(null); setEditing(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary" data-testid="cli-f-submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
