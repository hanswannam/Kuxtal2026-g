import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Gift, Search, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import BulkImportModal from '../../components/BulkImportModal';
import api from '../../lib/api';

const EMPTY_FORM = {
  contract_number: '', dpi: '', name: '', email: '', phone: '',
  service_years: 1, membership_start: '', membership_end: '',
  family_members_allowed: 1, investment_amount: 0, investment_plan: '', status: 'active',
  contract_date: '', age: 0, marital_status: '', nationality: '', profession: '', address: '',
  coowner_name: '', coowner_nationality: '', coowner_profession: '', coowner_phone: '', coowner_email: '',
  vigencia: '', cuotas: '', bank: '', termination_date: '', tc: '', nit: '', billing_name: '', observations: '',
};

export function AdminMembers({ members, memberForm, setMemberForm, showMemberForm, setShowMemberForm, editingMember, setEditingMember, saveMember, editMember, deleteMember, reloadData }) {
  const set = (k, v) => setMemberForm({ ...memberForm, [k]: v });

  // Búsqueda / filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const normalize = (s) => (s || '').toString().toLowerCase();
  const filteredMembers = members.filter(m => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = normalize(searchQuery);
    return (
      normalize(m.name).includes(q) ||
      normalize(m.contract_number).includes(q) ||
      normalize(m.dpi).includes(q) ||
      normalize(m.phone).includes(q) ||
      normalize(m.email).includes(q)
    );
  });

  // Regalías picker
  const [allRegalias, setAllRegalias] = useState([]);
  const [selectedRegaliaIds, setSelectedRegaliaIds] = useState([]);
  const [savingRegalias, setSavingRegalias] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    if (!showMemberForm) return;
    api.get('/regalias?all=true')
      .then(r => setAllRegalias(r.data))
      .catch(e => console.error('Failed to load regalias:', e));
    if (editingMember?._id) {
      api.get(`/regalias?member_id=${editingMember._id}`)
        .then(r => setSelectedRegaliaIds(r.data.map(x => x._id)))
        .catch(e => { console.error('Failed to load member regalias:', e); setSelectedRegaliaIds([]); });
    } else {
      setSelectedRegaliaIds([]);
    }
  }, [showMemberForm, editingMember]);

  const toggleRegalia = (id) => {
    setSelectedRegaliaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const persistRegalias = async () => {
    if (!editingMember?._id) return;
    setSavingRegalias(true);
    try {
      await api.put(`/members/${editingMember._id}/regalias`, { regalia_ids: selectedRegaliaIds });
      toast.success('Regalías asignadas');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al asignar regalías');
    }
    setSavingRegalias(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveMember(e);
    // After saving the member, also persist regalia assignments (only when editing existing)
    if (editingMember?._id) {
      await persistRegalias();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Socios ({filteredMembers.length}{filteredMembers.length !== members.length ? ` de ${members.length}` : ''})</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowBulkImport(true)}
            variant="outline"
            className="rounded-full"
            data-testid="bulk-import-members-btn"
          >
            <Upload className="w-4 h-4 mr-2" /> Importar Excel
          </Button>
          <Button
            onClick={() => { setShowMemberForm(true); setEditingMember(null); setMemberForm(EMPTY_FORM); }}
            className="rounded-full"
            data-testid="add-member-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Socio
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-3 mb-4 flex flex-col sm:flex-row gap-2" data-testid="members-filters">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, contrato, DPI, teléfono o email..."
            className="pl-9 rounded-xl"
            data-testid="members-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="members-search-clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-input px-3 text-sm bg-white"
          data-testid="members-status-filter"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="members-table">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-3 font-medium">Contrato</th>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Teléfono</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Estado</th>
                <th className="text-right p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8 text-sm" data-testid="members-empty">
                    No se encontraron socios con los filtros aplicados
                  </td>
                </tr>
              )}
              {filteredMembers.map((m, i) => (
                <tr key={m._id} className="border-t border-border hover:bg-secondary/30 transition-colors" data-testid={`member-row-${i}`}>
                  <td className="p-3 font-medium">{m.contract_number}</td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3 hidden sm:table-cell">{m.phone || '-'}</td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="rounded-full text-xs">
                      {m.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => editMember(m)} data-testid={`edit-member-${i}`}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <DeleteWithCode onConfirm={(code) => deleteMember(m._id, code)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMemberForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="member-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-4">{editingMember ? 'Editar Socio' : 'Nuevo Socio'}</h3>
            <form onSubmit={handleSave} className="space-y-5">

              {/* Sección Propietario */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Datos del Propietario</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Fecha de Contrato</Label><Input type="date" value={memberForm.contract_date || ''} onChange={e => set('contract_date', e.target.value)} className="rounded-xl mt-1" data-testid="mf-contract-date" /></div>
                  <div><Label className="text-xs">No. Contrato</Label><Input value={memberForm.contract_number} onChange={e => set('contract_number', e.target.value)} required className="rounded-xl mt-1" data-testid="mf-contract" /></div>
                </div>
                <div className="mt-3"><Label className="text-xs">Nombre del Propietario</Label><Input value={memberForm.name} onChange={e => set('name', e.target.value)} required className="rounded-xl mt-1" data-testid="mf-name" /></div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">Edad</Label><Input type="number" value={memberForm.age || 0} onChange={e => set('age', parseInt(e.target.value) || 0)} className="rounded-xl mt-1" data-testid="mf-age" /></div>
                  <div>
                    <Label className="text-xs">Estado Civil</Label>
                    <select value={memberForm.marital_status || ''} onChange={e => set('marital_status', e.target.value)} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="mf-marital">
                      <option value="">Seleccionar...</option>
                      <option value="soltero">Soltero(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viudo">Viudo(a)</option>
                      <option value="union_libre">Unión Libre</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">Nacionalidad</Label><Input value={memberForm.nationality || ''} onChange={e => set('nationality', e.target.value)} placeholder="Ej: Guatemalteca" className="rounded-xl mt-1" data-testid="mf-nationality" /></div>
                  <div><Label className="text-xs">Profesión</Label><Input value={memberForm.profession || ''} onChange={e => set('profession', e.target.value)} className="rounded-xl mt-1" data-testid="mf-profession" /></div>
                </div>
                <div className="mt-3"><Label className="text-xs">Domicilio</Label><Input value={memberForm.address || ''} onChange={e => set('address', e.target.value)} className="rounded-xl mt-1" data-testid="mf-address" /></div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">DPI</Label><Input value={memberForm.dpi} onChange={e => set('dpi', e.target.value)} required className="rounded-xl mt-1" data-testid="mf-dpi" /></div>
                  <div><Label className="text-xs">Teléfono</Label><Input value={memberForm.phone} onChange={e => set('phone', e.target.value)} className="rounded-xl mt-1" data-testid="mf-phone" /></div>
                </div>
                <div className="mt-3"><Label className="text-xs">Correo</Label><Input type="email" value={memberForm.email} onChange={e => set('email', e.target.value)} className="rounded-xl mt-1" data-testid="mf-email" /></div>
              </div>

              {/* Sección Copropietario */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Datos del Copropietario (opcional)</h4>
                <div><Label className="text-xs">Nombre del Copropietario</Label><Input value={memberForm.coowner_name || ''} onChange={e => set('coowner_name', e.target.value)} className="rounded-xl mt-1" data-testid="mf-co-name" /></div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">Nacionalidad</Label><Input value={memberForm.coowner_nationality || ''} onChange={e => set('coowner_nationality', e.target.value)} className="rounded-xl mt-1" data-testid="mf-co-nationality" /></div>
                  <div><Label className="text-xs">Profesión</Label><Input value={memberForm.coowner_profession || ''} onChange={e => set('coowner_profession', e.target.value)} className="rounded-xl mt-1" data-testid="mf-co-profession" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">Teléfono</Label><Input value={memberForm.coowner_phone || ''} onChange={e => set('coowner_phone', e.target.value)} className="rounded-xl mt-1" data-testid="mf-co-phone" /></div>
                  <div><Label className="text-xs">Correo</Label><Input type="email" value={memberForm.coowner_email || ''} onChange={e => set('coowner_email', e.target.value)} className="rounded-xl mt-1" data-testid="mf-co-email" /></div>
                </div>
              </div>

              {/* Sección Contrato / Inversión */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Contrato e Inversión</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Inversión (Q.)</Label><Input type="number" value={memberForm.investment_amount || 0} onChange={e => set('investment_amount', parseFloat(e.target.value) || 0)} className="rounded-xl mt-1" data-testid="mf-investment" /></div>
                  <div><Label className="text-xs">Vigencia</Label><Input value={memberForm.vigencia || ''} onChange={e => set('vigencia', e.target.value)} placeholder="Ej: 5 años, indefinida" className="rounded-xl mt-1" data-testid="mf-vigencia" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div><Label className="text-xs">Cuotas</Label><Input value={memberForm.cuotas || ''} onChange={e => set('cuotas', e.target.value)} placeholder="Ej: 10" className="rounded-xl mt-1" data-testid="mf-cuotas" /></div>
                  <div><Label className="text-xs">Banco</Label><Input value={memberForm.bank || ''} onChange={e => set('bank', e.target.value)} className="rounded-xl mt-1" data-testid="mf-bank" /></div>
                  <div><Label className="text-xs">Fecha Terminación</Label><Input type="date" value={memberForm.termination_date || ''} onChange={e => set('termination_date', e.target.value)} className="rounded-xl mt-1" data-testid="mf-term-date" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div><Label className="text-xs">TC</Label><Input value={memberForm.tc || ''} onChange={e => set('tc', e.target.value)} placeholder="TC" className="rounded-xl mt-1" data-testid="mf-tc" /></div>
                  <div><Label className="text-xs">NIT</Label><Input value={memberForm.nit || ''} onChange={e => set('nit', e.target.value)} className="rounded-xl mt-1" data-testid="mf-nit" /></div>
                  <div><Label className="text-xs">Nombre Facturación</Label><Input value={memberForm.billing_name || ''} onChange={e => set('billing_name', e.target.value)} className="rounded-xl mt-1" data-testid="mf-billing" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">Inicio Membresía</Label><Input type="date" value={memberForm.membership_start || ''} onChange={e => set('membership_start', e.target.value)} className="rounded-xl mt-1" data-testid="mf-start" /></div>
                  <div><Label className="text-xs">Fin Membresía</Label><Input type="date" value={memberForm.membership_end || ''} onChange={e => set('membership_end', e.target.value)} className="rounded-xl mt-1" data-testid="mf-end" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div><Label className="text-xs">Años de Servicio</Label><Input type="number" value={memberForm.service_years || 1} onChange={e => set('service_years', parseInt(e.target.value) || 1)} className="rounded-xl mt-1" data-testid="mf-years" /></div>
                  <div><Label className="text-xs">Familiares</Label><Input type="number" value={memberForm.family_members_allowed || 1} onChange={e => set('family_members_allowed', parseInt(e.target.value) || 1)} className="rounded-xl mt-1" data-testid="mf-family" /></div>
                  <div>
                    <Label className="text-xs">Estado</Label>
                    <select value={memberForm.status} onChange={e => set('status', e.target.value)} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="mf-status">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3"><Label className="text-xs">Plan de Inversión</Label><Input value={memberForm.investment_plan || ''} onChange={e => set('investment_plan', e.target.value)} placeholder="Ej: Plan Premium 5 años" className="rounded-xl mt-1" data-testid="mf-plan" /></div>
              </div>

              {/* Observaciones */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Observaciones</h4>
                <Textarea
                  value={memberForm.observations || ''}
                  onChange={e => set('observations', e.target.value)}
                  placeholder="Notas internas sobre el socio..."
                  className="rounded-xl min-h-[80px]"
                  data-testid="mf-observations"
                />
              </div>

              {/* Regalías asignadas (solo en edición) */}
              {editingMember?._id && (
                <div className="pt-4 border-t border-border" data-testid="mf-regalias-section">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Regalías Activas</h4>
                    {savingRegalias && <span className="text-xs text-muted-foreground">Guardando...</span>}
                  </div>
                  {allRegalias.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay regalías creadas. Créalas desde el módulo "Regalías".</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-xl p-3 bg-secondary/20">
                      {allRegalias.map(r => {
                        const isTaken = r.member_id && r.member_id !== editingMember._id;
                        const isSelected = selectedRegaliaIds.includes(r._id);
                        return (
                          <label
                            key={r._id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border bg-white'
                            } ${isTaken && !isSelected ? 'opacity-50' : ''}`}
                            data-testid={`mf-regalia-${r._id}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRegalia(r._id)}
                              disabled={isTaken && !isSelected}
                              className="rounded"
                            />
                            <span className="flex-1 truncate">
                              {r.name}
                              {isTaken && !isSelected && (
                                <span className="ml-1 text-[10px] text-muted-foreground">(asignada a otro)</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Marca las regalías que quieres activar para este socio. Se guardarán al presionar "Guardar".
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowMemberForm(false); setEditingMember(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="mf-submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Importar socios desde Excel"
        entityLabel="socios"
        templateEndpoint="/admin/members/template"
        importEndpoint="/admin/members/bulk-import"
        templateFilename="plantilla_socios.xlsx"
        onImported={() => { reloadData && reloadData(); }}
      />
    </div>
  );
}
