import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Send, Phone, Edit2, Eye, MessageCircle, Search, X, Plus, Minus, ClipboardCopy, Check, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { QuotationPreviewModal } from './QuotationPreview';
import { PackageSearchSelect, CustomerPicker } from './QuotationHelpers';

const STATUS_META = {
  pending:   { label: 'Pendiente',   class: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'En revisión', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  sent:      { label: 'Enviada',     class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  approved:  { label: 'Aprobada',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:  { label: 'Rechazada',   class: 'bg-rose-50 text-rose-700 border-rose-200' },
  closed:    { label: 'Cerrada',     class: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function AdminQuotations({ quotations: initialQuotations }) {
  const [quotations, setQuotations] = useState(initialQuotations);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { setQuotations(initialQuotations); }, [initialQuotations]);

  const reload = async () => {
    const r = await api.get('/quotations');
    setQuotations(r.data);
  };

  const norm = (s) => (s || '').toString().toLowerCase();
  const filtered = useMemo(() => quotations.filter(x => {
    if (statusFilter && x.status !== statusFilter) return false;
    if (memberFilter === 'yes' && !x.is_member) return false;
    if (memberFilter === 'no' && x.is_member) return false;
    if (q.trim()) {
      const n = norm(q);
      if (!norm(x.name).includes(n) && !norm(x.email).includes(n) && !norm(x.phone).includes(n)
        && !norm(x.contract_number).includes(n) && !norm(x.package_title).includes(n)) return false;
    }
    return true;
  }), [quotations, q, statusFilter, memberFilter]);

  return (
    <div className="animate-fade-in" data-testid="admin-quotations">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold">Cotizaciones ({filtered.length}{filtered.length !== quotations.length ? ` de ${quotations.length}` : ''})</h2>
        <Button onClick={() => setCreating(true)} className="rounded-full" data-testid="new-quot-btn">
          <Plus className="w-4 h-4 mr-2" /> Nueva Cotización
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-3 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2" data-testid="quot-filters">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre, email, teléfono, paquete..." className="pl-9 rounded-xl" data-testid="quot-search" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="quot-filter-status">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="quot-filter-member">
          <option value="">Socios y no socios</option>
          <option value="yes">Solo socios</option>
          <option value="no">Solo no socios</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center text-sm text-muted-foreground" data-testid="quot-empty">
          No hay cotizaciones con los filtros aplicados
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((x, i) => (
            <QuotationCard key={x._id} quot={x} index={i} onEdit={() => setEditing(x)} onPreview={() => setPreviewing(x)} onChange={reload} />
          ))}
        </div>
      )}

      {editing && (
        <QuotationEditor
          quot={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { await reload(); setEditing(null); }}
        />
      )}

      {previewing && (
        <QuotationPreviewModal quot={previewing} onClose={() => setPreviewing(null)} onChange={reload} />
      )}

      {creating && (
        <NewQuotationModal onClose={() => setCreating(false)} onCreated={async () => { await reload(); setCreating(false); }} />
      )}
    </div>
  );
}

function QuotationCard({ quot, index, onEdit, onPreview, onChange }) {
  const status = STATUS_META[quot.status] || STATUS_META.pending;
  const total = Number(quot.total) || 0;

  const quickStatus = async (s) => {
    try {
      await api.put(`/quotations/${quot._id}`, { status: s });
      toast.success('Estado actualizado');
      onChange();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all" data-testid={`admin-quotation-${index}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{quot.name}</h3>
            {quot.is_member ? (
              <Badge className="rounded-full text-[10px] bg-primary text-white" data-testid={`badge-socio-${index}`}>
                <User className="w-3 h-3 mr-1" /> Socio {quot.contract_number}
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full text-[10px]">No socio</Badge>
            )}
            <Badge className={`rounded-full text-[10px] border ${status.class}`}>{status.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{quot.email} · {quot.phone}</p>
          {quot.package_title && (
            <p className="text-sm mt-1.5">📦 <span className="font-medium">{quot.package_title}</span> {quot.package_country && <span className="text-muted-foreground">· {quot.package_country}</span>}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {total > 0 && <p className="font-bold text-lg text-primary">Q.{total.toLocaleString()}</p>}
          <p className="text-[11px] text-muted-foreground">{quot.guests || 1} pax · {new Date(quot.created_at).toLocaleDateString('es')}</p>
        </div>
      </div>

      {quot.message && <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded-lg p-2 mb-3">"{quot.message}"</p>}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        <Button size="sm" onClick={onEdit} className="rounded-full text-xs" data-testid={`edit-quot-${index}`}>
          <Edit2 className="w-3 h-3 mr-1" /> Editar
        </Button>
        <Button size="sm" variant="outline" onClick={onPreview} className="rounded-full text-xs" data-testid={`preview-quot-${index}`}>
          <Eye className="w-3 h-3 mr-1" /> Ver / Compartir
        </Button>
        {quot.status === 'pending' && (
          <Button size="sm" variant="outline" onClick={() => quickStatus('in_review')} className="rounded-full text-xs">Marcar en revisión</Button>
        )}
        {(quot.status === 'in_review' || quot.status === 'sent') && (
          <Button size="sm" variant="outline" onClick={() => quickStatus('approved')} className="rounded-full text-xs text-emerald-700 border-emerald-200">Aprobar</Button>
        )}
      </div>
    </div>
  );
}

function QuotationEditor({ quot, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: quot.status || 'pending',
    travel_date: quot.travel_date || '',
    guests: quot.guests || 1,
    unit_price: quot.unit_price || 0,
    member_unit_price: quot.member_unit_price || 0,
    discount: quot.discount || 0,
    total: quot.total || 0,
    customer_notes: quot.customer_notes || '',
    internal_notes: quot.internal_notes || '',
    extras: quot.extras || [],
    package_id: quot.package_id || '',
  });
  const [extraInput, setExtraInput] = useState({ name: '', price: 0 });
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState([]);
  const [timeline, setTimeline] = useState(quot.timeline || []);

  useEffect(() => {
    api.get('/packages').then(r => setPackages(r.data)).catch(() => {});
  }, []);

  const addExtra = () => {
    const name = extraInput.name.trim();
    const price = Number(extraInput.price) || 0;
    if (!name) return;
    setForm(f => ({ ...f, extras: [...f.extras, { name, price }] }));
    setExtraInput({ name: '', price: 0 });
  };
  const removeExtra = (idx) => setForm(f => ({ ...f, extras: f.extras.filter((_, i) => i !== idx) }));

  const applyPkg = async (pkgId) => {
    if (!pkgId) return setForm(f => ({ ...f, package_id: '' }));
    // Prefer locally loaded packages; otherwise fetch
    let pkg = packages.find(p => p._id === pkgId);
    if (!pkg) {
      try {
        const r = await api.get(`/packages/${pkgId}`);
        pkg = r.data;
      } catch { /* ignore */ }
    }
    if (!pkg) return setForm(f => ({ ...f, package_id: pkgId }));
    setForm(f => ({ ...f, package_id: pkgId, unit_price: pkg.price || 0, member_unit_price: pkg.member_price || 0 }));
  };

  const baseUnit = quot.is_member && form.member_unit_price > 0 ? form.member_unit_price : form.unit_price;
  const extrasTotal = (form.extras || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  const autoTotal = Math.max(0, (baseUnit * (Number(form.guests) || 1)) + extrasTotal - (Number(form.discount) || 0));

  const useAutoTotal = () => setForm(f => ({ ...f, total: autoTotal }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/quotations/${quot._id}`, form);
      toast.success('Cotización guardada');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    }
    setSaving(false);
  };

  const addNote = async () => {
    const n = newNote.trim();
    if (!n) return;
    try {
      const r = await api.post(`/quotations/${quot._id}/timeline`, { note: n });
      setTimeline(prev => [...prev, r.data]);
      setNewNote('');
      toast.success('Nota agregada');
    } catch { toast.error('Error'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="quot-editor">
      <div className="bg-white rounded-2xl w-full max-w-4xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl font-semibold">Editar Cotización</h3>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: form */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Paquete</Label>
              <PackageSearchSelect value={form.package_id} onChange={applyPkg} testId="ed-package" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Estado</Label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="ed-status">
                  {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Fecha de viaje</Label>
                <Input type="date" value={form.travel_date} onChange={e => setForm({ ...form, travel_date: e.target.value })} className="rounded-xl mt-1" data-testid="ed-date" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Pax</Label><Input type="number" min="1" value={form.guests} onChange={e => setForm({ ...form, guests: parseInt(e.target.value) || 1 })} className="rounded-xl mt-1" data-testid="ed-guests" /></div>
              <div><Label className="text-xs">Precio Unit.</Label><Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} className="rounded-xl mt-1" data-testid="ed-unit" /></div>
              <div><Label className="text-xs">Precio Socio</Label><Input type="number" step="0.01" value={form.member_unit_price} onChange={e => setForm({ ...form, member_unit_price: parseFloat(e.target.value) || 0 })} className="rounded-xl mt-1" data-testid="ed-member-unit" /></div>
            </div>

            <div>
              <Label className="text-xs">Extras (vuelos, traslados, tours...)</Label>
              <div className="space-y-1.5 mt-1">
                {form.extras.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-secondary/30 rounded-lg p-2">
                    <span className="flex-1 truncate">{e.name}</span>
                    <span className="font-mono">Q.{(Number(e.price) || 0).toLocaleString()}</span>
                    <button type="button" onClick={() => removeExtra(i)} className="text-destructive"><Minus className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <Input value={extraInput.name} onChange={e => setExtraInput({ ...extraInput, name: e.target.value })} placeholder="Concepto" className="rounded-xl h-9 flex-1" />
                  <Input type="number" value={extraInput.price} onChange={e => setExtraInput({ ...extraInput, price: e.target.value })} placeholder="Q." className="rounded-xl h-9 w-24" />
                  <Button type="button" size="sm" onClick={addExtra} className="rounded-xl"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Descuento</Label><Input type="number" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} className="rounded-xl mt-1" data-testid="ed-discount" /></div>
              <div>
                <Label className="text-xs">Total (Q.)</Label>
                <div className="flex gap-1.5 mt-1">
                  <Input type="number" step="0.01" value={form.total} onChange={e => setForm({ ...form, total: parseFloat(e.target.value) || 0 })} className="rounded-xl flex-1 font-bold" data-testid="ed-total" />
                  <Button type="button" size="sm" variant="outline" onClick={useAutoTotal} className="rounded-xl text-[10px]" title={`Auto: Q.${autoTotal.toLocaleString()}`}>Auto</Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas para el cliente</Label>
              <Textarea value={form.customer_notes} onChange={e => setForm({ ...form, customer_notes: e.target.value })} placeholder="Información adicional, condiciones, etc." className="rounded-xl mt-1" rows={3} data-testid="ed-customer-notes" />
            </div>
            <div>
              <Label className="text-xs">Notas internas</Label>
              <Textarea value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })} placeholder="Solo visible para el equipo" className="rounded-xl mt-1" rows={2} data-testid="ed-internal-notes" />
            </div>
          </div>

          {/* Right: timeline */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide">Seguimiento</Label>
            <div className="space-y-2 mt-2 max-h-[350px] overflow-y-auto pr-1" data-testid="quot-timeline">
              {timeline.length === 0 && <p className="text-xs text-muted-foreground italic">Sin eventos aún</p>}
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 bg-secondary/30 rounded-lg p-2">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="w-2.5 h-2.5 inline mr-1" />
                      {new Date(t.at).toLocaleString('es')}
                      {t.by && ` · ${t.by}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-1.5">
              <Input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Agregar nota de seguimiento..." className="rounded-xl h-9 flex-1" onKeyDown={e => e.key === 'Enter' && addNote()} data-testid="quot-new-note" />
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="rounded-xl">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-5 mt-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-primary" data-testid="ed-save">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewQuotationModal({ onClose, onCreated }) {
  const [customer, setCustomer] = useState({ type: 'new', name: '', email: '', phone: '' });
  const [packageId, setPackageId] = useState('');
  const [guests, setGuests] = useState(2);
  const [travelDate, setTravelDate] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    // Validate
    if (customer.type === 'new' && !customer.name.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (customer.type === 'member' && !customer.member_id) {
      toast.error('Selecciona un socio');
      return;
    }
    if (customer.type === 'client' && !customer.client_id) {
      toast.error('Selecciona un cliente');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        member_id: customer.type === 'member' ? customer.member_id : '',
        client_id: customer.type === 'client' ? customer.client_id : '',
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        package_id: packageId,
        guests,
        travel_date: travelDate,
        message,
      };
      await api.post('/quotations/admin', payload);
      toast.success('Cotización creada');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="new-quot-modal">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl font-semibold">Nueva Cotización</h3>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide">Cliente</Label>
            <div className="mt-2">
              <CustomerPicker value={customer} onChange={setCustomer} />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide">Paquete</Label>
            <PackageSearchSelect value={packageId} onChange={setPackageId} testId="newq-pkg" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Pax</Label><Input type="number" min="1" value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)} className="rounded-xl mt-1" data-testid="newq-guests" /></div>
            <div><Label className="text-xs">Fecha de viaje</Label><Input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} className="rounded-xl mt-1" data-testid="newq-date" /></div>
          </div>

          <div>
            <Label className="text-xs">Mensaje / notas</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="rounded-xl mt-1" placeholder="Información adicional sobre la cotización" data-testid="newq-message" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary" data-testid="newq-submit">
              {saving ? 'Creando...' : 'Crear Cotización'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

