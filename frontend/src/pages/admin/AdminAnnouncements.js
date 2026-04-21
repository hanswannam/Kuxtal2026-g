import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus } from 'lucide-react';
import { DeleteWithCode } from '../../components/DeleteWithCode';

export function AdminAnnouncements({ announcements, announcementForm, setAnnouncementForm, showAnnouncementForm, setShowAnnouncementForm, saveAnnouncement, deleteAnn }) {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-lg font-semibold">Anuncios ({announcements.length})</h2>
        <Button onClick={() => setShowAnnouncementForm(true)} className="rounded-full" data-testid="add-announcement-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Anuncio
        </Button>
      </div>
      <div className="space-y-3">
        {announcements.map((a, i) => (
          <div key={a._id} className="bg-white rounded-2xl p-5 border border-border flex justify-between items-start" data-testid={`admin-announcement-${i}`}>
            <div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="rounded-full text-xs">{a.target}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('es')}</span>
              </div>
            </div>
            <DeleteWithCode onConfirm={(code) => deleteAnn(a._id, code)} />
          </div>
        ))}
      </div>

      {showAnnouncementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="announcement-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-xl font-semibold mb-4">Nuevo Anuncio</h3>
            <form onSubmit={saveAnnouncement} className="space-y-3">
              <div><Label className="text-xs">Título</Label><Input value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="af-title" /></div>
              <div><Label className="text-xs">Contenido</Label><Textarea value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} required className="rounded-xl mt-1" data-testid="af-content" /></div>
              <div><Label className="text-xs">Enlace (opcional)</Label><Input value={announcementForm.link} onChange={e => setAnnouncementForm({...announcementForm, link: e.target.value})} className="rounded-xl mt-1" data-testid="af-link" /></div>
              <div>
                <Label className="text-xs">Dirigido a</Label>
                <select value={announcementForm.target} onChange={e => setAnnouncementForm({...announcementForm, target: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="af-target">
                  <option value="all">Todos</option>
                  <option value="members">Socios</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAnnouncementForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="af-submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
