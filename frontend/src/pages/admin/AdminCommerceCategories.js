import React, { useEffect, useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit2, Save, X, Upload, Smile, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import EmojiPicker from 'emoji-picker-react';

// Show an emoji as text, OR a URL as an <img>. Icon is just a string.
function IconDisplay({ icon, className = '' }) {
  if (!icon) return <span className={className}>🏷️</span>;
  const isUrl = icon.startsWith('http') || icon.startsWith('/');
  if (isUrl) {
    return <img src={icon} alt="icon" className={`${className} object-contain rounded`} />;
  }
  return <span className={className}>{icon}</span>;
}

function IconEditor({ icon, onChange, testIdPrefix = '' }) {
  const [mode, setMode] = useState(null); // 'emoji' | 'upload' | null
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error('Imagen muy grande (máx 1MB)');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(r.data.url);
      setMode(null);
    } catch (err) {
      toast.error('Error al subir imagen');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setMode(mode ? null : 'emoji')}
        className="h-12 w-14 rounded-xl border border-input bg-white flex items-center justify-center hover:border-primary/50 transition overflow-hidden"
        data-testid={`${testIdPrefix}icon-trigger`}
      >
        <IconDisplay icon={icon} className={icon?.startsWith('http') || icon?.startsWith('/') ? 'w-9 h-9' : 'text-3xl'} />
      </button>

      {mode && (
        <div className="absolute z-50 mt-2 left-0 bg-white rounded-xl border border-border shadow-lg p-2" data-testid={`${testIdPrefix}icon-panel`}>
          <div className="flex gap-1 mb-2">
            <Button type="button" size="sm" variant={mode === 'emoji' ? 'default' : 'outline'} onClick={() => setMode('emoji')} className="rounded-lg flex-1" data-testid={`${testIdPrefix}mode-emoji`}>
              <Smile className="w-3.5 h-3.5 mr-1" /> Emoji
            </Button>
            <Button type="button" size="sm" variant={mode === 'upload' ? 'default' : 'outline'} onClick={() => { setMode('upload'); fileRef.current?.click(); }} className="rounded-lg flex-1" data-testid={`${testIdPrefix}mode-upload`}>
              <Upload className="w-3.5 h-3.5 mr-1" /> Subir
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode(null)} className="rounded-lg">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {mode === 'emoji' && (
            <EmojiPicker
              onEmojiClick={(e) => { onChange(e.emoji); setMode(null); }}
              height={320}
              width={300}
              searchPlaceHolder="Buscar emoji..."
            />
          )}

          {mode === 'upload' && (
            <div className="p-3 text-center">
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleUpload} />
              <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl w-full" data-testid={`${testIdPrefix}upload-btn`}>
                <ImageIcon className="w-4 h-4 mr-2" /> {uploading ? 'Subiendo...' : 'Elegir imagen'}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">PNG / JPG / SVG — máx 1MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminCommerceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🏷️');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/commerce/categories?full=true')
      .then(r => setCategories(r.data || []))
      .catch(() => toast.error('Error al cargar categorías'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (cat) => {
    setEditing(cat.name);
    setDraftName(cat.name);
    setDraftIcon(cat.icon || '🏷️');
  };
  const cancelEdit = () => { setEditing(null); setDraftName(''); setDraftIcon(''); };

  const saveEdit = async (originalName, isSystem) => {
    const payload = { icon: draftIcon };
    if (!isSystem) payload.name = draftName.trim();
    try {
      await api.put(`/commerce/categories/${encodeURIComponent(originalName)}`, payload);
      toast.success('Categoría actualizada');
      cancelEdit();
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al actualizar');
    }
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/commerce/categories', { name: newName.trim(), icon: newIcon });
      toast.success('Categoría creada');
      setNewName(''); setNewIcon('🏷️'); setShowNew(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear');
    }
    setCreating(false);
  };

  const deleteCategory = async (name, code) => {
    try {
      await api.delete(`/commerce/categories/${encodeURIComponent(name)}?delete_code=${encodeURIComponent(code)}`);
      toast.success('Categoría eliminada');
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al eliminar');
    }
  };

  return (
    <div className="animate-fade-in" data-testid="admin-commerce-categories">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center mb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Categorías de Comercios</h2>
          <p className="text-xs text-muted-foreground">Elige emoji o sube tu propia imagen. Edita nombres y crea nuevas categorías.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full" data-testid="cat-add-btn">
          <Plus className="w-4 h-4 mr-2" /> Nueva
        </Button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl border border-border p-4 mb-4" data-testid="cat-new-form">
          <p className="text-sm font-semibold mb-3">Nueva categoría</p>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <IconEditor icon={newIcon} onChange={setNewIcon} testIdPrefix="cat-new-" />
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nombre de la categoría (ej: Farmacia)"
              className="rounded-xl flex-1"
              data-testid="cat-new-name-input"
            />
            <div className="flex gap-2">
              <Button onClick={createCategory} disabled={!newName.trim() || creating} className="rounded-xl" data-testid="cat-new-save">
                <Save className="w-4 h-4 mr-1" /> {creating ? 'Guardando...' : 'Crear'}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="rounded-xl">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center text-sm text-muted-foreground">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => {
            const isEditing = editing === c.name;
            return (
              <div
                key={c.name}
                className={`bg-white rounded-2xl border p-4 transition-all ${isEditing ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
                data-testid={`cat-card-${c.name}`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <IconEditor icon={draftIcon} onChange={setDraftIcon} testIdPrefix="cat-edit-" />
                      <Input
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        disabled={c.system}
                        className="rounded-xl flex-1"
                        data-testid="cat-edit-name"
                      />
                    </div>
                    {c.system && <p className="text-[11px] text-muted-foreground italic">Categoría del sistema — solo se puede cambiar el icono.</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(c.name, c.system)} className="rounded-xl flex-1" data-testid="cat-edit-save">
                        <Save className="w-4 h-4 mr-1" /> Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="rounded-xl">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                      <IconDisplay icon={c.icon} className={c.icon?.startsWith('http') || c.icon?.startsWith('/') ? 'w-full h-full' : 'text-2xl'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <Badge variant="secondary" className="rounded-full text-[10px] mt-0.5 font-normal">
                        {c.system ? 'Sistema' : 'Personalizada'}
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)} data-testid={`cat-edit-${c.name}`}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {!c.system && (
                        <DeleteWithCode onConfirm={(code) => deleteCategory(c.name, code)} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
