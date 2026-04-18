import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Link2, Loader2, Sparkles, Check, X, FileText, Image, FileSpreadsheet, AlertCircle, Layers, FileDown, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

const MIME_ICONS = { 'application/pdf': FileText, 'image': Image, 'word': FileText, 'sheet': FileSpreadsheet };
function getMimeIcon(mime) {
  if (!mime) return FileText;
  for (const [key, Icon] of Object.entries(MIME_ICONS)) { if (mime.includes(key)) return Icon; }
  return FileText;
}

export function AdminImport({ onPackageCreated }) {
  const [mode, setMode] = useState('single'); // single | batch
  // Single mode
  const [driveUrl, setDriveUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mimeType, setMimeType] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [includeInput, setIncludeInput] = useState('');
  // Batch mode
  const [batchUrls, setBatchUrls] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: '' });
  const [batchResults, setBatchResults] = useState([]); // [{extracted, mime_type, url, error?, expanded?}]
  const [batchSaving, setBatchSaving] = useState(false);

  // ── Single Mode ──
  const processLink = async () => {
    if (!driveUrl.trim()) return toast.error('Pega un enlace de Google Drive');
    setLoading(true); setEditForm(null);
    try {
      const { data } = await api.post('/packages/import-from-drive', { drive_url: driveUrl });
      setEditForm({ ...data.extracted, image_url: '', gallery: [], status: 'active' });
      setMimeType(data.mime_type || '');
      toast.success('Datos extraidos correctamente');
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al procesar el documento'); }
    setLoading(false);
  };

  const addInclude = () => { if (includeInput.trim() && editForm) { setEditForm({ ...editForm, includes: [...(editForm.includes || []), includeInput.trim()] }); setIncludeInput(''); } };
  const removeInclude = (idx) => { setEditForm({ ...editForm, includes: editForm.includes.filter((_, i) => i !== idx) }); };

  const createPackage = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      await api.post('/packages', { ...editForm, price: Number(editForm.price) || 0, member_price: Number(editForm.member_price) || 0, duration_days: Number(editForm.duration_days) || 1 });
      toast.success('Paquete creado exitosamente');
      setDriveUrl(''); setEditForm(null);
      if (onPackageCreated) onPackageCreated();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al crear paquete'); }
    setSaving(false);
  };

  // ── Batch Mode ──
  const processBatch = async () => {
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (urls.length === 0) return toast.error('Pega al menos un enlace de Google Drive');
    if (urls.length > 20) return toast.error('Maximo 20 enlaces por lote');

    setBatchProcessing(true);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: urls.length, status: 'Iniciando...' });

    const results = [];
    for (let i = 0; i < urls.length; i++) {
      setBatchProgress({ current: i + 1, total: urls.length, status: `Procesando ${i + 1} de ${urls.length}...` });
      try {
        const { data } = await api.post('/packages/import-from-drive', { drive_url: urls[i] });
        results.push({
          url: urls[i],
          extracted: { ...data.extracted, image_url: '', gallery: [], status: 'active' },
          mime_type: data.mime_type || '',
          error: null,
          expanded: false,
          selected: true,
        });
      } catch (err) {
        results.push({
          url: urls[i],
          extracted: null,
          mime_type: '',
          error: err.response?.data?.detail || 'Error al procesar',
          expanded: false,
          selected: false,
        });
      }
      setBatchResults([...results]);
    }

    const successCount = results.filter(r => !r.error).length;
    const failCount = results.filter(r => r.error).length;
    setBatchProgress({ current: urls.length, total: urls.length, status: `Completado: ${successCount} exitosos, ${failCount} fallidos` });
    if (successCount > 0) toast.success(`${successCount} documentos procesados correctamente`);
    if (failCount > 0) toast.error(`${failCount} documentos fallaron`);
    setBatchProcessing(false);
  };

  const toggleBatchExpand = (idx) => {
    setBatchResults(prev => prev.map((r, i) => i === idx ? { ...r, expanded: !r.expanded } : r));
  };

  const toggleBatchSelect = (idx) => {
    setBatchResults(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const removeBatchItem = (idx) => {
    setBatchResults(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBatchField = (idx, field, value) => {
    setBatchResults(prev => prev.map((r, i) => i === idx ? { ...r, extracted: { ...r.extracted, [field]: value } } : r));
  };

  const createAllBatch = async () => {
    const selected = batchResults.filter(r => r.selected && r.extracted);
    if (selected.length === 0) return toast.error('Selecciona al menos un paquete');
    setBatchSaving(true);
    let created = 0;
    let failed = 0;
    for (const item of selected) {
      try {
        await api.post('/packages', {
          ...item.extracted,
          price: Number(item.extracted.price) || 0,
          member_price: Number(item.extracted.member_price) || 0,
          duration_days: Number(item.extracted.duration_days) || 1,
        });
        created++;
      } catch { failed++; }
    }
    toast.success(`${created} paquetes creados${failed > 0 ? `, ${failed} fallaron` : ''}`);
    setBatchResults([]);
    setBatchUrls('');
    setBatchSaving(false);
    if (onPackageCreated) onPackageCreated();
  };

  const MimeIcon = getMimeIcon(mimeType);
  const successBatch = batchResults.filter(r => !r.error);
  const selectedCount = batchResults.filter(r => r.selected && r.extracted).length;

  return (
    <div className="animate-fade-in space-y-6" data-testid="admin-import">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">Importar Paquetes con AI</h2>
            <p className="text-sm text-muted-foreground">Pega enlaces de Google Drive y el AI extraera la informacion automaticamente</p>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          <Badge variant="secondary" className="rounded-full text-xs">PDF</Badge>
          <Badge variant="secondary" className="rounded-full text-xs">Imagenes</Badge>
          <Badge variant="secondary" className="rounded-full text-xs">Word</Badge>
          <Badge variant="secondary" className="rounded-full text-xs">Excel</Badge>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2" data-testid="import-mode-toggle">
        <button
          onClick={() => setMode('single')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === 'single' ? 'bg-primary text-white shadow-md' : 'bg-white border border-border text-muted-foreground hover:border-primary/30'}`}
          data-testid="import-mode-single"
        >
          <FileDown className="w-4 h-4" /> Individual
        </button>
        <button
          onClick={() => setMode('batch')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === 'batch' ? 'bg-primary text-white shadow-md' : 'bg-white border border-border text-muted-foreground hover:border-primary/30'}`}
          data-testid="import-mode-batch"
        >
          <Layers className="w-4 h-4" /> Lote (Multiples)
        </button>
      </div>

      {/* ══════════ SINGLE MODE ══════════ */}
      {mode === 'single' && (
        <>
          <div className="bg-white rounded-2xl p-6 border border-border">
            <Label className="text-sm font-semibold flex items-center gap-2 mb-3"><Link2 className="w-4 h-4 text-primary" /> Enlace de Google Drive</Label>
            <div className="flex gap-2">
              <Input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." className="rounded-xl" onKeyDown={e => { if (e.key === 'Enter') processLink(); }} disabled={loading} data-testid="import-drive-url" />
              <Button onClick={processLink} disabled={loading || !driveUrl.trim()} className="rounded-xl bg-primary hover:bg-primary/90 shrink-0 px-6" data-testid="import-process-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span className="ml-2">{loading ? 'Procesando...' : 'Procesar'}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Asegurate de que el archivo este compartido como "Cualquier persona con el enlace puede ver"</p>
          </div>

          {loading && (
            <div className="bg-white rounded-2xl p-12 border border-border text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">Analizando documento...</h3>
              <p className="text-sm text-muted-foreground">Gemini AI esta leyendo y extrayendo la informacion del paquete</p>
            </div>
          )}

          {editForm && !loading && (
            <SingleEditForm
              editForm={editForm} setEditForm={setEditForm} mimeType={mimeType}
              includeInput={includeInput} setIncludeInput={setIncludeInput}
              addInclude={addInclude} removeInclude={removeInclude}
              createPackage={createPackage} saving={saving}
              onCancel={() => { setEditForm(null); }}
            />
          )}
        </>
      )}

      {/* ══════════ BATCH MODE ══════════ */}
      {mode === 'batch' && (
        <>
          <div className="bg-white rounded-2xl p-6 border border-border">
            <Label className="text-sm font-semibold flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-primary" /> Enlaces de Google Drive (uno por linea)</Label>
            <Textarea
              value={batchUrls}
              onChange={e => setBatchUrls(e.target.value)}
              placeholder={"https://drive.google.com/file/d/abc123...\nhttps://drive.google.com/file/d/def456...\nhttps://drive.google.com/file/d/ghi789..."}
              rows={6}
              className="rounded-xl font-mono text-xs"
              disabled={batchProcessing}
              data-testid="import-batch-urls"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                {batchUrls.split('\n').filter(u => u.trim()).length} enlaces detectados (max 20)
              </p>
              <Button
                onClick={processBatch}
                disabled={batchProcessing || !batchUrls.trim()}
                className="rounded-xl bg-primary hover:bg-primary/90 px-6"
                data-testid="import-batch-process-btn"
              >
                {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {batchProcessing ? 'Procesando...' : 'Procesar Todos'}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {(batchProcessing || batchProgress.total > 0) && (
            <div className="bg-white rounded-2xl p-5 border border-border" data-testid="batch-progress">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{batchProgress.status}</span>
                <span className="text-xs text-muted-foreground">{batchProgress.current}/{batchProgress.total}</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Batch Results */}
          {batchResults.length > 0 && !batchProcessing && (
            <div className="space-y-3" data-testid="batch-results">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold">
                  Resultados ({successBatch.length} exitosos de {batchResults.length})
                </h3>
                {selectedCount > 0 && (
                  <Button onClick={createAllBatch} disabled={batchSaving} className="rounded-xl bg-primary hover:bg-primary/90" data-testid="batch-create-all-btn">
                    {batchSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    {batchSaving ? 'Creando...' : `Crear ${selectedCount} Paquetes`}
                  </Button>
                )}
              </div>

              {batchResults.map((item, idx) => (
                <div key={`batch-${idx}`} className={`bg-white rounded-2xl border overflow-hidden transition-all ${item.error ? 'border-destructive/30 bg-destructive/5' : item.selected ? 'border-primary/30' : 'border-border'}`} data-testid={`batch-item-${idx}`}>
                  {/* Summary Row */}
                  <div className="flex items-center gap-3 p-4">
                    {!item.error && (
                      <input type="checkbox" checked={item.selected} onChange={() => toggleBatchSelect(idx)} className="w-4 h-4 rounded accent-primary shrink-0" data-testid={`batch-select-${idx}`} />
                    )}
                    <div className={`p-1.5 rounded-lg shrink-0 ${item.error ? 'bg-destructive/10' : 'bg-emerald-50'}`}>
                      {item.error ? <AlertCircle className="w-4 h-4 text-destructive" /> : <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.error ? (
                        <div>
                          <p className="text-sm font-medium text-destructive">Error</p>
                          <p className="text-xs text-muted-foreground truncate">{item.error}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold line-clamp-1">{item.extracted.title}</p>
                          <p className="text-xs text-muted-foreground">{item.extracted.country} &middot; {item.extracted.duration_days} dias &middot; Q.{Number(item.extracted.price).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.extracted && (
                        <Badge variant="secondary" className="rounded-full text-[10px]">{item.extracted.category}</Badge>
                      )}
                      {!item.error && (
                        <button onClick={() => toggleBatchExpand(idx)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" data-testid={`batch-expand-${idx}`}>
                          {item.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => removeBatchItem(idx)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" data-testid={`batch-remove-${idx}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit */}
                  {item.expanded && item.extracted && (
                    <div className="px-4 pb-4 pt-0 border-t border-border space-y-3 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label className="text-xs">Titulo</Label>
                          <Input value={item.extracted.title} onChange={e => updateBatchField(idx, 'title', e.target.value)} className="rounded-lg mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Pais</Label>
                          <Input value={item.extracted.country} onChange={e => updateBatchField(idx, 'country', e.target.value)} className="rounded-lg mt-1 h-9 text-sm" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Descripcion corta</Label>
                        <Input value={item.extracted.short_description} onChange={e => updateBatchField(idx, 'short_description', e.target.value)} className="rounded-lg mt-1 h-9 text-sm" />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Precio (Q.)</Label>
                          <Input type="number" value={item.extracted.price} onChange={e => updateBatchField(idx, 'price', e.target.value)} className="rounded-lg mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Precio Socio</Label>
                          <Input type="number" value={item.extracted.member_price} onChange={e => updateBatchField(idx, 'member_price', e.target.value)} className="rounded-lg mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Dias</Label>
                          <Input type="number" value={item.extracted.duration_days} onChange={e => updateBatchField(idx, 'duration_days', e.target.value)} className="rounded-lg mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Categoria</Label>
                          <select value={item.extracted.category} onChange={e => updateBatchField(idx, 'category', e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-input px-2 text-sm">
                            <option value="paquete">Paquete</option>
                            <option value="alojamiento">Alojamiento</option>
                            <option value="experiencia">Experiencia</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Alojamiento</Label>
                          <select value={item.extracted.accommodation_type || ''} onChange={e => updateBatchField(idx, 'accommodation_type', e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-input px-2 text-sm">
                            <option value="">-</option><option value="hotel">Hotel</option><option value="resort">Resort</option><option value="villa">Villa</option><option value="hostel">Hostel</option><option value="camping">Camping</option><option value="airbnb">Airbnb</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Dificultad</Label>
                          <select value={item.extracted.difficulty || ''} onChange={e => updateBatchField(idx, 'difficulty', e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-input px-2 text-sm">
                            <option value="">-</option><option value="facil">Facil</option><option value="moderado">Moderado</option><option value="dificil">Dificil</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Min</Label><Input type="number" value={item.extracted.min_group || 1} onChange={e => updateBatchField(idx, 'min_group', parseInt(e.target.value) || 1)} className="rounded-lg mt-1 h-9 text-sm" /></div>
                          <div><Label className="text-xs">Max</Label><Input type="number" value={item.extracted.max_group || 20} onChange={e => updateBatchField(idx, 'max_group', parseInt(e.target.value) || 20)} className="rounded-lg mt-1 h-9 text-sm" /></div>
                        </div>
                      </div>
                      {item.extracted.includes?.length > 0 && (
                        <div>
                          <Label className="text-xs">Incluye</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.extracted.includes.map((inc) => <Badge key={inc} variant="secondary" className="rounded-full text-xs">{inc}</Badge>)}
                          </div>
                        </div>
                      )}
                      {item.extracted.itinerary?.length > 0 && (
                        <div>
                          <Label className="text-xs">Itinerario ({item.extracted.itinerary.length} dias)</Label>
                          <div className="space-y-1 mt-1">
                            {item.extracted.itinerary.map((d, di) => (
                              <div key={`it-${di}`} className="text-xs p-2 bg-secondary/50 rounded-lg"><strong>Dia {d.day || di+1}:</strong> {d.title} - {d.description?.slice(0,100)}{d.description?.length > 100 ? '...' : ''}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Single Edit Form (extracted from original) ──
function SingleEditForm({ editForm, setEditForm, mimeType, includeInput, setIncludeInput, addInclude, removeInclude, createPackage, saving, onCancel }) {
  const MimeIcon = getMimeIcon(mimeType);
  return (
    <div className="bg-white rounded-2xl p-6 border border-border space-y-4" data-testid="single-edit-form">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50"><Check className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Datos Extraidos</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><MimeIcon className="w-3 h-3" /> Procesado con Gemini AI</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground"><X className="w-4 h-4" /></Button>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">Revisa y edita los datos antes de crear el paquete. El AI puede cometer errores.</p>
      </div>

      <div><Label className="text-xs">Titulo</Label><Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="rounded-xl mt-1" data-testid="import-title" /></div>
      <div><Label className="text-xs">Descripcion corta</Label><Input value={editForm.short_description} onChange={e => setEditForm({...editForm, short_description: e.target.value})} className="rounded-xl mt-1" data-testid="import-short-desc" /></div>
      <div><Label className="text-xs">Descripcion completa</Label><Textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="rounded-xl mt-1" data-testid="import-description" /></div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Pais / Destino</Label><Input value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} className="rounded-xl mt-1" data-testid="import-country" /></div>
        <div>
          <Label className="text-xs">Categoria</Label>
          <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="import-category">
            <option value="paquete">Paquete</option><option value="alojamiento">Alojamiento</option><option value="experiencia">Experiencia</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Precio (Q.)</Label><Input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="rounded-xl mt-1" data-testid="import-price" /></div>
        <div><Label className="text-xs">Precio Socio</Label><Input type="number" value={editForm.member_price} onChange={e => setEditForm({...editForm, member_price: e.target.value})} className="rounded-xl mt-1" data-testid="import-member-price" /></div>
        <div><Label className="text-xs">Dias</Label><Input type="number" value={editForm.duration_days} onChange={e => setEditForm({...editForm, duration_days: e.target.value})} className="rounded-xl mt-1" data-testid="import-days" /></div>
      </div>

      <div><Label className="text-xs">URL Imagen</Label><Input value={editForm.image_url || ''} onChange={e => setEditForm({...editForm, image_url: e.target.value})} placeholder="URL de la imagen del paquete" className="rounded-xl mt-1" data-testid="import-image" /></div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Alojamiento</Label>
          <select value={editForm.accommodation_type || ''} onChange={e => setEditForm({...editForm, accommodation_type: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="import-accommodation">
            <option value="">Sin especificar</option><option value="hotel">Hotel</option><option value="resort">Resort</option><option value="villa">Villa</option><option value="hostel">Hostel</option><option value="camping">Camping</option><option value="airbnb">Airbnb</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Dificultad</Label>
          <select value={editForm.difficulty || ''} onChange={e => setEditForm({...editForm, difficulty: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="import-difficulty">
            <option value="">Sin especificar</option><option value="facil">Facil</option><option value="moderado">Moderado</option><option value="dificil">Dificil</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Min. grupo</Label><Input type="number" value={editForm.min_group || 1} onChange={e => setEditForm({...editForm, min_group: parseInt(e.target.value) || 1})} className="rounded-xl mt-1" data-testid="import-min-group" /></div>
          <div><Label className="text-xs">Max. grupo</Label><Input type="number" value={editForm.max_group || 20} onChange={e => setEditForm({...editForm, max_group: parseInt(e.target.value) || 20})} className="rounded-xl mt-1" data-testid="import-max-group" /></div>
        </div>
      </div>

      <div>
        <Label className="text-xs">Incluye</Label>
        <div className="flex gap-2 mt-1">
          <Input value={includeInput} onChange={e => setIncludeInput(e.target.value)} placeholder="Ej: Boletos aereos" className="rounded-xl" onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addInclude();}}} data-testid="import-include-input" />
          <Button type="button" onClick={addInclude} size="sm" className="rounded-xl">+</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(editForm.includes || []).map((inc, idx) => (
            <span key={inc} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs">{inc}<button onClick={() => removeInclude(idx)}><X className="w-3 h-3" /></button></span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={editForm.featured || false} onChange={e => setEditForm({...editForm, featured: e.target.checked})} id="import-featured" data-testid="import-featured" />
        <Label htmlFor="import-featured" className="text-xs">Destacado</Label>
      </div>

      {editForm.itinerary && editForm.itinerary.length > 0 && (
        <div data-testid="import-itinerary">
          <Label className="text-xs font-semibold">Itinerario ({editForm.itinerary.length} dias)</Label>
          <div className="space-y-2 mt-2">
            {editForm.itinerary.map((day, idx) => (
              <div key={`day-${idx}`} className="p-3 bg-secondary/50 rounded-xl text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{day.day || idx + 1}</span>
                  <input value={day.title || ''} onChange={e => { const it = [...editForm.itinerary]; it[idx] = {...it[idx], title: e.target.value}; setEditForm({...editForm, itinerary: it}); }} className="flex-1 bg-white rounded-lg border border-input px-2 py-1 text-xs font-medium" />
                  <button onClick={() => setEditForm({...editForm, itinerary: editForm.itinerary.filter((_, i) => i !== idx)})} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                </div>
                <textarea value={day.description || ''} onChange={e => { const it = [...editForm.itinerary]; it[idx] = {...it[idx], description: e.target.value}; setEditForm({...editForm, itinerary: it}); }} rows={2} className="w-full bg-white rounded-lg border border-input px-2 py-1 text-xs resize-none" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-3 border-t border-border">
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl" data-testid="import-cancel">Cancelar</Button>
        <Button onClick={createPackage} disabled={saving} className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="import-create-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {saving ? 'Creando...' : 'Crear Paquete'}
        </Button>
      </div>
    </div>
  );
}
