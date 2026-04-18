import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Upload, Link2, Loader2, Sparkles, Check, X, FileText, Image, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

const MIME_ICONS = {
  'application/pdf': FileText,
  'image': Image,
  'word': FileText,
  'sheet': FileSpreadsheet,
};

function getMimeIcon(mime) {
  if (!mime) return FileText;
  for (const [key, Icon] of Object.entries(MIME_ICONS)) {
    if (mime.includes(key)) return Icon;
  }
  return FileText;
}

export function AdminImport({ onPackageCreated }) {
  const [driveUrl, setDriveUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [mimeType, setMimeType] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [includeInput, setIncludeInput] = useState('');

  const processLink = async () => {
    if (!driveUrl.trim()) return toast.error('Pega un enlace de Google Drive');
    setLoading(true);
    setExtracted(null);
    setEditForm(null);
    try {
      const { data } = await api.post('/packages/import-from-drive', { drive_url: driveUrl });
      setExtracted(data.extracted);
      setEditForm({ ...data.extracted, image_url: '', gallery: [], status: 'active' });
      setMimeType(data.mime_type || '');
      toast.success('Datos extraidos correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al procesar el documento');
    }
    setLoading(false);
  };

  const addInclude = () => {
    if (includeInput.trim() && editForm) {
      setEditForm({ ...editForm, includes: [...(editForm.includes || []), includeInput.trim()] });
      setIncludeInput('');
    }
  };

  const removeInclude = (idx) => {
    setEditForm({ ...editForm, includes: editForm.includes.filter((_, i) => i !== idx) });
  };

  const createPackage = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price) || 0,
        member_price: Number(editForm.member_price) || 0,
        duration_days: Number(editForm.duration_days) || 1,
      };
      await api.post('/packages', payload);
      toast.success('Paquete creado exitosamente');
      setDriveUrl('');
      setExtracted(null);
      setEditForm(null);
      if (onPackageCreated) onPackageCreated();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear paquete');
    }
    setSaving(false);
  };

  const MimeIcon = getMimeIcon(mimeType);

  return (
    <div className="animate-fade-in space-y-6" data-testid="admin-import">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">Importar Paquete con AI</h2>
            <p className="text-sm text-muted-foreground">Pega un enlace de Google Drive y el AI extraera la informacion automaticamente</p>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          <Badge variant="secondary" className="rounded-full text-xs">PDF</Badge>
          <Badge variant="secondary" className="rounded-full text-xs">Imagenes</Badge>
          <Badge variant="secondary" className="rounded-full text-xs">Word</Badge>
          <Badge variant="secondary" className="rounded-full text-xs">Excel</Badge>
        </div>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-2xl p-6 border border-border">
        <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-primary" /> Enlace de Google Drive
        </Label>
        <div className="flex gap-2">
          <Input
            value={driveUrl}
            onChange={e => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="rounded-xl"
            onKeyDown={e => { if (e.key === 'Enter') processLink(); }}
            disabled={loading}
            data-testid="import-drive-url"
          />
          <Button
            onClick={processLink}
            disabled={loading || !driveUrl.trim()}
            className="rounded-xl bg-primary hover:bg-primary/90 shrink-0 px-6"
            data-testid="import-process-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-2">{loading ? 'Procesando...' : 'Procesar'}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Asegurate de que el archivo este compartido como "Cualquier persona con el enlace puede ver"
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Analizando documento...</h3>
          <p className="text-sm text-muted-foreground">Gemini AI esta leyendo y extrayendo la informacion del paquete</p>
        </div>
      )}

      {/* Extracted Data - Edit Form */}
      {editForm && !loading && (
        <div className="bg-white rounded-2xl p-6 border border-border space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Datos Extraidos</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MimeIcon className="w-3 h-3" /> Procesado con Gemini AI
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setEditForm(null); setExtracted(null); }} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Revisa y edita los datos antes de crear el paquete. El AI puede cometer errores.</p>
          </div>

          <div>
            <Label className="text-xs">Titulo</Label>
            <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="rounded-xl mt-1" data-testid="import-title" />
          </div>

          <div>
            <Label className="text-xs">Descripcion corta</Label>
            <Input value={editForm.short_description} onChange={e => setEditForm({...editForm, short_description: e.target.value})} className="rounded-xl mt-1" data-testid="import-short-desc" />
          </div>

          <div>
            <Label className="text-xs">Descripcion completa</Label>
            <Textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="rounded-xl mt-1" data-testid="import-description" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pais / Destino</Label>
              <Input value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} className="rounded-xl mt-1" data-testid="import-country" />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="import-category">
                <option value="paquete">Paquete</option>
                <option value="alojamiento">Alojamiento</option>
                <option value="experiencia">Experiencia</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Precio (Q.)</Label>
              <Input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="rounded-xl mt-1" data-testid="import-price" />
            </div>
            <div>
              <Label className="text-xs">Precio Socio</Label>
              <Input type="number" value={editForm.member_price} onChange={e => setEditForm({...editForm, member_price: e.target.value})} className="rounded-xl mt-1" data-testid="import-member-price" />
            </div>
            <div>
              <Label className="text-xs">Dias</Label>
              <Input type="number" value={editForm.duration_days} onChange={e => setEditForm({...editForm, duration_days: e.target.value})} className="rounded-xl mt-1" data-testid="import-days" />
            </div>
          </div>

          <div>
            <Label className="text-xs">URL Imagen</Label>
            <Input value={editForm.image_url || ''} onChange={e => setEditForm({...editForm, image_url: e.target.value})} placeholder="URL de la imagen del paquete" className="rounded-xl mt-1" data-testid="import-image" />
          </div>

          <div>
            <Label className="text-xs">Incluye</Label>
            <div className="flex gap-2 mt-1">
              <Input value={includeInput} onChange={e => setIncludeInput(e.target.value)} placeholder="Ej: Boletos aereos" className="rounded-xl" onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addInclude();}}} data-testid="import-include-input" />
              <Button type="button" onClick={addInclude} size="sm" className="rounded-xl">+</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(editForm.includes || []).map((inc, idx) => (
                <span key={inc} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs">
                  {inc}<button onClick={() => removeInclude(idx)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={editForm.featured || false} onChange={e => setEditForm({...editForm, featured: e.target.checked})} id="import-featured" data-testid="import-featured" />
            <Label htmlFor="import-featured" className="text-xs">Destacado</Label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => { setEditForm(null); setExtracted(null); }} className="flex-1 rounded-xl" data-testid="import-cancel">
              Cancelar
            </Button>
            <Button onClick={createPackage} disabled={saving} className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="import-create-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {saving ? 'Creando...' : 'Crear Paquete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
