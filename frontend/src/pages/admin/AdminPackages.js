import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, X, Upload, Package } from 'lucide-react';
import { DeleteWithCode } from '../../components/DeleteWithCode';

export function AdminPackages({ packages, packageForm, setPackageForm, showPackageForm, setShowPackageForm, editingPackage, setEditingPackage, savePackage, editPkg, deletePkg, includesInput, setIncludesInput, addInclude, removeInclude, handleImageUpload, uploading }) {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Paquetes ({packages.length})</h2>
        <Button onClick={() => { setShowPackageForm(true); setEditingPackage(null); setPackageForm({ title: '', description: '', short_description: '', country: '', price: 0, member_price: 0, duration_days: 1, category: 'paquete', includes: [], rating: 4.8, image_url: '', gallery: [], featured: false, status: 'active' }); }} className="rounded-full" data-testid="add-package-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Paquete
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((p, i) => (
          <div key={p._id} className="bg-white rounded-2xl border border-border overflow-hidden" data-testid={`pkg-card-${i}`}>
            <div className="aspect-video bg-muted overflow-hidden">
              {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-8 h-8" /></div>}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="rounded-full text-xs">{p.category}</Badge>
                {p.featured && <Badge className="rounded-full text-xs bg-primary">Destacado</Badge>}
              </div>
              <h3 className="font-semibold mb-1 line-clamp-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{p.country} &middot; {p.duration_days} dias</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">Q.{p.price?.toLocaleString()}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => editPkg(p)} data-testid={`edit-pkg-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                  <DeleteWithCode onConfirm={(code) => deletePkg(p._id, code)} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPackageForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="package-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-4">{editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}</h3>
            <form onSubmit={savePackage} className="space-y-3">
              <div><Label className="text-xs">Titulo</Label><Input value={packageForm.title} onChange={e => setPackageForm({...packageForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-title" /></div>
              <div><Label className="text-xs">Descripcion corta</Label><Input value={packageForm.short_description} onChange={e => setPackageForm({...packageForm, short_description: e.target.value})} className="rounded-xl mt-1" data-testid="pf-short-desc" /></div>
              <div><Label className="text-xs">Descripcion</Label><Textarea value={packageForm.description} onChange={e => setPackageForm({...packageForm, description: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Pais</Label><Input value={packageForm.country} onChange={e => setPackageForm({...packageForm, country: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-country" /></div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <select value={packageForm.category} onChange={e => setPackageForm({...packageForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="pf-category">
                    <option value="paquete">Paquete</option>
                    <option value="alojamiento">Alojamiento</option>
                    <option value="experiencia">Experiencia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Precio (Q.)</Label><Input type="number" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-price" /></div>
                <div><Label className="text-xs">Precio Socio</Label><Input type="number" value={packageForm.member_price} onChange={e => setPackageForm({...packageForm, member_price: e.target.value})} className="rounded-xl mt-1" data-testid="pf-member-price" /></div>
                <div><Label className="text-xs">Dias</Label><Input type="number" value={packageForm.duration_days} onChange={e => setPackageForm({...packageForm, duration_days: e.target.value})} className="rounded-xl mt-1" data-testid="pf-days" /></div>
              </div>
              <div>
                <Label className="text-xs">URL Imagen</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={packageForm.image_url} onChange={e => setPackageForm({...packageForm, image_url: e.target.value})} className="rounded-xl" data-testid="pf-image" placeholder="URL o sube imagen" />
                  <label className="shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setPackageForm({...packageForm, image_url: url}))} />
                    <Button type="button" variant="outline" size="sm" className="rounded-xl h-10" disabled={uploading} asChild>
                      <span><Upload className="w-4 h-4" /></span>
                    </Button>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-xs">Incluye</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={includesInput} onChange={e => setIncludesInput(e.target.value)} placeholder="Ej: Boletos Aereos" className="rounded-xl" onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addInclude();}}} data-testid="pf-include-input" />
                  <Button type="button" onClick={addInclude} size="sm" className="rounded-xl" data-testid="pf-add-include">+</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {packageForm.includes.map((inc, idx) => (
                    <span key={inc} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs">
                      {inc}<button type="button" onClick={() => removeInclude(idx)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={packageForm.featured} onChange={e => setPackageForm({...packageForm, featured: e.target.checked})} id="featured" data-testid="pf-featured" />
                <Label htmlFor="featured" className="text-xs">Destacado</Label>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Promoción (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Inicio Promoción</Label>
                    <Input type="date" value={packageForm.promo_start || ''} onChange={e => setPackageForm({...packageForm, promo_start: e.target.value})} className="rounded-xl mt-1" data-testid="pf-promo-start" />
                  </div>
                  <div>
                    <Label className="text-xs">Fin Promoción</Label>
                    <Input type="date" value={packageForm.promo_end || ''} onChange={e => setPackageForm({...packageForm, promo_end: e.target.value})} className="rounded-xl mt-1" data-testid="pf-promo-end" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Si se define una fecha de fin, se mostrará un contador regresivo al público.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowPackageForm(false); setEditingPackage(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="pf-submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
