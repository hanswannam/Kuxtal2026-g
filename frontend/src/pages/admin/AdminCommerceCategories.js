import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit2, Save, X, Smile, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import EmojiPicker from 'emoji-picker-react';

export function AdminCommerceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // name being edited
  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // New category state
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🏷️');
  const [newPickerOpen, setNewPickerOpen] = useState(false);
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
    setPickerOpen(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraftName('');
    setDraftIcon('');
    setPickerOpen(false);
  };

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
      setNewName(''); setNewIcon('🏷️'); setShowNew(false); setNewPickerOpen(false);
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
          <p className="text-xs text-muted-foreground">Edita nombres, iconos y crea nuevas categorías. Miles de emojis disponibles.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full" data-testid="cat-add-btn">
          <Plus className="w-4 h-4 mr-2" /> Nueva
        </Button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl border border-border p-4 mb-4" data-testid="cat-new-form">
          <p className="text-sm font-semibold mb-3">Nueva categoría</p>
          <div className="flex flex-col sm:flex-row gap-2 items-start">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNewPickerOpen(!newPickerOpen)}
                className="h-10 w-14 rounded-xl border border-input bg-white text-2xl hover:border-primary/50 transition"
                data-testid="cat-new-icon-trigger"
              >
                {newIcon}
              </button>
              {newPickerOpen && (
                <div className="absolute z-50 mt-2">
                  <EmojiPicker
                    onEmojiClick={(e) => { setNewIcon(e.emoji); setNewPickerOpen(false); }}
                    height={350}
                    width={320}
                    searchPlaceHolder="Buscar emoji..."
                  />
                </div>
              )}
            </div>
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
              <Button variant="outline" onClick={() => { setShowNew(false); setNewPickerOpen(false); }} className="rounded-xl">
                Cancelar
              </Button>
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
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setPickerOpen(!pickerOpen)}
                          className="h-12 w-14 rounded-xl border border-input bg-white text-3xl hover:border-primary/50 transition"
                          data-testid="cat-edit-icon-trigger"
                        >
                          {draftIcon}
                        </button>
                        {pickerOpen && (
                          <div className="absolute z-50 mt-2 left-0">
                            <EmojiPicker
                              onEmojiClick={(e) => { setDraftIcon(e.emoji); setPickerOpen(false); }}
                              height={350}
                              width={320}
                              searchPlaceHolder="Buscar emoji..."
                            />
                          </div>
                        )}
                      </div>
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
                    <div className="text-3xl shrink-0" aria-label={c.name}>{c.icon || '🏷️'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <Badge variant={c.system ? 'default' : 'secondary'} className="rounded-full text-[10px] mt-0.5">
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
