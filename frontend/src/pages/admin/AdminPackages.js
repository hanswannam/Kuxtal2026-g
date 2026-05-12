import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, X, Upload, Package, Search, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import BulkImportModal from '../../components/BulkImportModal';
import ImageWithFallback from '../../components/ImageWithFallback';
import PackageRichContent from '../../components/PackageRichContent';
import api from '../../lib/api';

const DEACTIVATION_PRESETS = [
  'Temporada cerrada',
  'Agotado / sin disponibilidad',
  'Pendiente de actualizar precio',
  'Proveedor no confirma',
  'Pausa temporal',
];

export function AdminPackages({ packages, packageForm, setPackageForm, showPackageForm, setShowPackageForm, editingPackage, setEditingPackage, savePackage, editPkg, deletePkg, includesInput, setIncludesInput, addInclude, removeInclude, handleImageUpload, uploading, reloadPackages }) {
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null); // package being deactivated; modal open when set
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [pricingCfg, setPricingCfg] = useState({ public_markup_percent: 30, member_markup_percent: 15 });

  useEffect(() => {
    api.get('/config/pricing-settings').then(r => setPricingCfg(r.data)).catch(() => {});
  }, []);

  const computePublicPrice = (agency) => {
    const v = parseFloat(agency) || 0;
    return v > 0 ? Math.round(v * (1 + (parseFloat(pricingCfg.public_markup_percent) || 0) / 100)) : 0;
  };
  const computeMemberPrice = (agency) => {
    const v = parseFloat(agency) || 0;
    return v > 0 ? Math.round(v * (1 + (parseFloat(pricingCfg.member_markup_percent) || 0) / 100)) : 0;
  };
  const applySuggestedPrices = () => {
    const agency = parseFloat(packageForm.agency_price) || 0;
    if (agency <= 0) { toast.error('Primero ingresa el precio de agencia'); return; }
    setPackageForm({
      ...packageForm,
      price: computePublicPrice(agency),
      member_price: computeMemberPrice(agency),
    });
    toast.success('Precios sugeridos aplicados');
  };

  const countries = useMemo(() => Array.from(new Set(packages.map(p => p.country).filter(Boolean))).sort(), [packages]);

  const norm = (s) => (s || '').toString().toLowerCase();
  const filtered = packages.filter(p => {
    if (catFilter && p.category !== catFilter) return false;
    if (countryFilter && p.country !== countryFilter) return false;
    if (featuredFilter === 'yes' && !p.featured) return false;
    if (featuredFilter === 'no' && p.featured) return false;
    const vis = p.visibility || 'public';
    if (visibilityFilter === 'public' && vis !== 'public') return false;
    if (visibilityFilter === 'internal' && vis !== 'internal') return false;
    const isActive = (p.status || 'active') === 'active';
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'inactive' && isActive) return false;
    if (q.trim()) {
      const n = norm(q);
      if (!norm(p.title).includes(n) && !norm(p.short_description).includes(n) && !norm(p.description).includes(n) && !norm(p.country).includes(n)) return false;
    }
    return true;
  });

  const toggleStatus = async (p) => {
    const isActive = (p.status || 'active') === 'active';
    if (isActive) {
      // Opening modal to capture the reason
      setDeactivateTarget(p);
      setDeactivationReason('');
      return;
    }
    // Reactivation: no reason needed
    setTogglingId(p._id);
    try {
      await api.put(`/packages/${p._id}/toggle-status`);
      toast.success('Paquete activado');
      if (reloadPackages) await reloadPackages();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al cambiar estado');
    }
    setTogglingId(null);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const reason = deactivationReason.trim();
    if (!reason) { toast.error('Ingresa o elige un motivo de desactivación'); return; }
    setTogglingId(deactivateTarget._id);
    try {
      await api.put(`/packages/${deactivateTarget._id}/toggle-status`, { reason });
      toast.success('Paquete desactivado');
      setDeactivateTarget(null);
      setDeactivationReason('');
      if (reloadPackages) await reloadPackages();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al cambiar estado');
    }
    setTogglingId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Paquetes ({filtered.length}{filtered.length !== packages.length ? ` de ${packages.length}` : ''})</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkImport(true)} variant="outline" className="rounded-full" data-testid="bulk-import-packages-btn">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Importar Excel
          </Button>
          <Button onClick={() => { setShowPackageForm(true); setEditingPackage(null); setPackageForm({ title: '', description: '', short_description: '', country: '', agency_price: 0, price: 0, member_price: 0, duration_days: 1, category: 'paquete', includes: [], rating: 4.8, image_url: '', gallery: [], featured: false, status: 'active', promo_start: '', promo_end: '', visibility: 'public', youtube_url: '', has_itinerary: false, itinerary_days: [], hotels: [] }); }} className="rounded-full" data-testid="add-package-btn">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Paquete
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2" data-testid="pkg-filters">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por título, país, descripción..." className="pl-9 rounded-xl" data-testid="pkg-search" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="pkg-filter-category">
          <option value="">Todas las categorías</option>
          <option value="paquete">Paquete</option>
          <option value="alojamiento">Alojamiento</option>
          <option value="experiencia">Experiencia</option>
        </select>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="pkg-filter-country">
          <option value="">Todos los países</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="pkg-filter-featured">
          <option value="">Destacados y no</option>
          <option value="yes">Solo destacados</option>
          <option value="no">No destacados</option>
        </select>
        <select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="pkg-filter-visibility">
          <option value="">Todos (web + internos)</option>
          <option value="public">Solo visibles en web</option>
          <option value="internal">Solo internos (cotizaciones)</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="pkg-filter-status">
          <option value="">Activos e inactivos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center" data-testid="pkg-empty">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No se encontraron paquetes con los filtros aplicados</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => {
          const isActive = (p.status || 'active') === 'active';
          return (
          <div key={p._id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${isActive ? 'border-border' : 'border-red-200 opacity-70'}`} data-testid={`pkg-card-${i}`}>
            <div className="aspect-video bg-muted overflow-hidden relative">
              {p.image_url ? <ImageWithFallback src={p.image_url} alt={p.title} className={`w-full h-full object-cover ${!isActive ? 'grayscale' : ''}`} /> : <ImageWithFallback src="" alt={p.title} className={`w-full h-full ${!isActive ? 'grayscale' : ''}`} />}
              {!isActive && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Badge className="rounded-full bg-red-600 text-white">Inactivo</Badge></div>}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="rounded-full text-xs">{p.category}</Badge>
                {p.featured && <Badge className="rounded-full text-xs bg-primary">Destacado</Badge>}
                {p.visibility === 'internal' && <Badge className="rounded-full text-xs bg-amber-100 text-amber-700 border-amber-300">🔒 Solo cotiz.</Badge>}
              </div>
              <h3 className="font-semibold mb-1 line-clamp-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{p.country} &middot; {p.duration_days} días</p>
              {!isActive && p.deactivation_reason && (
                <div className="flex items-start gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 mb-2" data-testid={`pkg-reason-${i}`}>
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{p.deactivation_reason}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-primary">Q.{p.price?.toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => toggleStatus(p)}
                  disabled={togglingId === p._id}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                  data-testid={`toggle-pkg-${i}`}
                  title={isActive ? 'Desactivar paquete' : 'Activar paquete'}
                >
                  <span className={`relative inline-block w-8 h-4 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isActive ? 'left-4' : 'left-0.5'}`} />
                  </span>
                  {isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>
              <div className="flex gap-1 justify-end pt-2 border-t border-border">
                <Button size="sm" variant="ghost" onClick={() => editPkg(p)} data-testid={`edit-pkg-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                <DeleteWithCode onConfirm={(code) => deletePkg(p._id, code)} />
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {showPackageForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="package-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold mb-4">{editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}</h3>
            <form onSubmit={savePackage} className="space-y-3">
              <div><Label className="text-xs">Título</Label><Input value={packageForm.title} onChange={e => setPackageForm({...packageForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-title" /></div>
              <div><Label className="text-xs">Descripción corta</Label><Input value={packageForm.short_description} onChange={e => setPackageForm({...packageForm, short_description: e.target.value})} className="rounded-xl mt-1" data-testid="pf-short-desc" /></div>
              <div><Label className="text-xs">Descripción</Label><Textarea value={packageForm.description} onChange={e => setPackageForm({...packageForm, description: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">País</Label><Input value={packageForm.country} onChange={e => setPackageForm({...packageForm, country: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-country" /></div>
                <div>
                  <Label className="text-xs">Categoría</Label>
                  <select value={packageForm.category} onChange={e => setPackageForm({...packageForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="pf-category">
                    <option value="paquete">Paquete</option>
                    <option value="alojamiento">Alojamiento</option>
                    <option value="experiencia">Experiencia</option>
                  </select>
                </div>
              </div>
              <div className="bg-secondary/30 border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Precios</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Markup global: público +{pricingCfg.public_markup_percent}% · socio +{pricingCfg.member_markup_percent}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Precio agencia Q <span className="text-muted-foreground">(costo)</span></Label>
                    <Input
                      type="number"
                      value={packageForm.agency_price || ''}
                      onChange={e => setPackageForm({ ...packageForm, agency_price: e.target.value })}
                      className="rounded-xl mt-1"
                      data-testid="pf-agency-price"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center justify-between">
                      <span>Precio público Q</span>
                      {packageForm.agency_price > 0 && (
                        <span className="text-[10px] text-primary">sug. Q.{computePublicPrice(packageForm.agency_price)}</span>
                      )}
                    </Label>
                    <Input type="number" value={packageForm.price} onChange={e => setPackageForm({ ...packageForm, price: e.target.value })} required className="rounded-xl mt-1" data-testid="pf-price" />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center justify-between">
                      <span>Precio socio Q</span>
                      {packageForm.agency_price > 0 && (
                        <span className="text-[10px] text-primary">sug. Q.{computeMemberPrice(packageForm.agency_price)}</span>
                      )}
                    </Label>
                    <Input type="number" value={packageForm.member_price} onChange={e => setPackageForm({ ...packageForm, member_price: e.target.value })} className="rounded-xl mt-1" data-testid="pf-member-price" />
                  </div>
                  <div>
                    <Label className="text-xs">Días</Label>
                    <Input type="number" value={packageForm.duration_days} onChange={e => setPackageForm({ ...packageForm, duration_days: e.target.value })} className="rounded-xl mt-1" data-testid="pf-days" />
                  </div>
                </div>
                {packageForm.agency_price > 0 && (
                  <button
                    type="button"
                    onClick={applySuggestedPrices}
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                    data-testid="pf-apply-suggested"
                  >
                    Aplicar precios sugeridos (público Q.{computePublicPrice(packageForm.agency_price)} · socio Q.{computeMemberPrice(packageForm.agency_price)})
                  </button>
                )}
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
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Visibilidad</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPackageForm({...packageForm, visibility: 'public'})} className={`p-3 rounded-xl border text-left transition ${(packageForm.visibility || 'public') === 'public' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`} data-testid="pf-vis-public">
                    <p className="text-xs font-semibold">🌐 Visible en la web</p>
                    <p className="text-[10px] text-muted-foreground">Público y socios lo ven en el catálogo</p>
                  </button>
                  <button type="button" onClick={() => setPackageForm({...packageForm, visibility: 'internal'})} className={`p-3 rounded-xl border text-left transition ${packageForm.visibility === 'internal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`} data-testid="pf-vis-internal">
                    <p className="text-xs font-semibold">🔒 Solo cotizaciones</p>
                    <p className="text-[10px] text-muted-foreground">No aparece en la web; solo para cotizar</p>
                  </button>
                </div>
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

              <PackageRichContent form={packageForm} setForm={setPackageForm} />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowPackageForm(false); setEditingPackage(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="pf-submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="deactivate-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-heading text-lg font-semibold">Desactivar paquete</h3>
                  <p className="text-xs text-muted-foreground">{deactivateTarget.title}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setDeactivateTarget(null)}><X className="w-4 h-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">¿Por qué se desactiva? El motivo quedará visible en la tarjeta para el resto del equipo.</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DEACTIVATION_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDeactivationReason(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition ${deactivationReason === preset ? 'bg-primary text-white border-primary' : 'bg-secondary text-foreground border-border hover:border-primary/40'}`}
                  data-testid={`reason-preset-${preset.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Textarea
              value={deactivationReason}
              onChange={e => setDeactivationReason(e.target.value)}
              placeholder="Escribe un motivo personalizado o elige uno arriba..."
              className="rounded-xl"
              rows={3}
              data-testid="deactivation-reason-input"
            />
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeactivateTarget(null)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={confirmDeactivate} disabled={togglingId === deactivateTarget._id || !deactivationReason.trim()} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white" data-testid="confirm-deactivate-btn">
                {togglingId === deactivateTarget._id ? 'Desactivando...' : 'Desactivar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Importar paquetes desde Excel"
        entityLabel="paquetes"
        templateEndpoint="/admin/packages/template"
        importEndpoint="/admin/packages/bulk-import"
        templateFilename="plantilla_paquetes.xlsx"
        onImported={() => { reloadPackages && reloadPackages(); }}
      />
    </div>
  );
}
