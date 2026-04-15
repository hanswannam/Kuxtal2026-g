import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { DeleteWithCode } from '../../components/DeleteWithCode';

export function AdminMembers({ members, memberForm, setMemberForm, showMemberForm, setShowMemberForm, editingMember, setEditingMember, saveMember, editMember, deleteMember }) {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Socios ({members.length})</h2>
        <Button onClick={() => { setShowMemberForm(true); setEditingMember(null); setMemberForm({ contract_number: '', dpi: '', name: '', email: '', phone: '', service_years: 1, membership_start: '', membership_end: '', family_members_allowed: 1, status: 'active' }); }} className="rounded-full" data-testid="add-member-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Socio
        </Button>
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="members-table">
            <thead className="bg-secondary/50">
              <tr><th className="text-left p-3 font-medium">Contrato</th><th className="text-left p-3 font-medium">Nombre</th><th className="text-left p-3 font-medium hidden sm:table-cell">Anios</th><th className="text-left p-3 font-medium hidden md:table-cell">Estado</th><th className="text-right p-3 font-medium">Acciones</th></tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m._id} className="border-t border-border hover:bg-secondary/30 transition-colors" data-testid={`member-row-${i}`}>
                  <td className="p-3 font-medium">{m.contract_number}</td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3 hidden sm:table-cell">{m.service_years}</td>
                  <td className="p-3 hidden md:table-cell"><Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="rounded-full text-xs">{m.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => editMember(m)} data-testid={`edit-member-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-4">{editingMember ? 'Editar Socio' : 'Nuevo Socio'}</h3>
            <form onSubmit={saveMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Contrato</Label><Input value={memberForm.contract_number} onChange={e => setMemberForm({...memberForm, contract_number: e.target.value})} required className="rounded-xl mt-1" data-testid="mf-contract" /></div>
                <div><Label className="text-xs">DPI</Label><Input value={memberForm.dpi} onChange={e => setMemberForm({...memberForm, dpi: e.target.value})} required className="rounded-xl mt-1" data-testid="mf-dpi" /></div>
              </div>
              <div><Label className="text-xs">Nombre</Label><Input value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="mf-name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Email</Label><Input value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} className="rounded-xl mt-1" data-testid="mf-email" /></div>
                <div><Label className="text-xs">Telefono</Label><Input value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} className="rounded-xl mt-1" data-testid="mf-phone" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Anios Servicio</Label><Input type="number" value={memberForm.service_years} onChange={e => setMemberForm({...memberForm, service_years: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="mf-years" /></div>
                <div><Label className="text-xs">Inicio</Label><Input type="date" value={memberForm.membership_start} onChange={e => setMemberForm({...memberForm, membership_start: e.target.value})} className="rounded-xl mt-1" data-testid="mf-start" /></div>
                <div><Label className="text-xs">Fin</Label><Input type="date" value={memberForm.membership_end} onChange={e => setMemberForm({...memberForm, membership_end: e.target.value})} className="rounded-xl mt-1" data-testid="mf-end" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Familiares</Label><Input type="number" value={memberForm.family_members_allowed} onChange={e => setMemberForm({...memberForm, family_members_allowed: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="mf-family" /></div>
                <div>
                  <Label className="text-xs">Estado</Label>
                  <select value={memberForm.status} onChange={e => setMemberForm({...memberForm, status: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="mf-status">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Inversion (Q.)</Label><Input type="number" value={memberForm.investment_amount} onChange={e => setMemberForm({...memberForm, investment_amount: parseFloat(e.target.value) || 0})} className="rounded-xl mt-1" data-testid="mf-investment" /></div>
                <div><Label className="text-xs">Plan de Inversion</Label><Input value={memberForm.investment_plan} onChange={e => setMemberForm({...memberForm, investment_plan: e.target.value})} placeholder="Ej: Plan Premium 5 anios" className="rounded-xl mt-1" data-testid="mf-plan" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowMemberForm(false); setEditingMember(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="mf-submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
