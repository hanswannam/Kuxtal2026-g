import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Users, Plus, Trash2 } from 'lucide-react';

export function MemberFamily({ member, user, familyMembers, showFamilyForm, setShowFamilyForm, familyForm, setFamilyForm, addFamilyMember, removeFamilyMember }) {
  return (
    <div className="space-y-4 animate-fade-in" data-testid="member-family">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="font-heading text-lg font-semibold">Mi Familia</h2>
          <p className="text-xs text-muted-foreground">
            {familyMembers.length} de {member?.family_members_allowed || 0} familiares registrados
          </p>
        </div>
        {familyMembers.length < (member?.family_members_allowed || 0) && (
          <Button onClick={() => setShowFamilyForm(true)} className="rounded-full bg-primary hover:bg-primary/90" data-testid="add-family-btn">
            <Plus className="w-4 h-4 mr-2" /> Agregar Familiar
          </Button>
        )}
      </div>
      {familyMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin familiares registrados</h3>
          <p className="text-sm text-muted-foreground mb-4">Agrega familiares para que puedan acceder a los beneficios del club</p>
          <p className="text-xs text-muted-foreground">Cada familiar podra iniciar sesion con el mismo numero de contrato y su propio DPI</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {familyMembers.map((fm, i) => (
            <div key={fm._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`family-member-${i}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{fm.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{fm.relationship}</p>
                    <p className="text-xs text-muted-foreground mt-1">DPI: ****{fm.dpi?.slice(-4)}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeFamilyMember(fm._id)} className="text-destructive" data-testid={`remove-family-${i}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFamilyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="family-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-xl font-semibold mb-4">Agregar Familiar</h3>
            <form onSubmit={addFamilyMember} className="space-y-4">
              <div>
                <Label>Nombre completo</Label>
                <Input value={familyForm.name} onChange={e => setFamilyForm({...familyForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="family-name" />
              </div>
              <div>
                <Label>DPI</Label>
                <Input value={familyForm.dpi} onChange={e => setFamilyForm({...familyForm, dpi: e.target.value})} required placeholder="Numero de DPI del familiar" className="rounded-xl mt-1" data-testid="family-dpi" />
              </div>
              <div>
                <Label>Parentesco</Label>
                <select value={familyForm.relationship} onChange={e => setFamilyForm({...familyForm, relationship: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="family-relationship">
                  <option value="esposo/a">Esposo/a</option>
                  <option value="hijo/a">Hijo/a</option>
                  <option value="padre/madre">Padre/Madre</option>
                  <option value="hermano/a">Hermano/a</option>
                  <option value="familiar">Otro familiar</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">El familiar podra iniciar sesion con el contrato <strong>{member?.contract_number}</strong> y su DPI personal</p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowFamilyForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="family-submit">Agregar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
