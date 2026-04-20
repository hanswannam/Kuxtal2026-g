import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { FileText, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export function MemberObservations({ member, user }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newObs, setNewObs] = useState('');
  const [adding, setAdding] = useState(false);

  const memberId = member?._id || user?.member_id;
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    if (memberId) loadObservations();
    else setLoading(false);
  }, [memberId]);

  const loadObservations = async () => {
    try {
      const { data } = await api.get(`/members/${memberId}/observations`);
      setObservations(data);
    } catch (e) { console.error('Failed to load observations:', e); }
    setLoading(false);
  };

  const addObservation = async () => {
    if (!newObs.trim()) return;
    setAdding(true);
    try {
      await api.post(`/members/${memberId}/observations`, { content: newObs });
      toast.success('Observacion agregada');
      setNewObs('');
      loadObservations();
    } catch (e) { toast.error('Error al agregar observacion'); }
    setAdding(false);
  };

  const deleteObs = async (id) => {
    try {
      await api.delete(`/observations/${id}`);
      toast.success('Observacion eliminada');
      loadObservations();
    } catch (e) { toast.error('Error al eliminar'); }
  };

  return (
    <div className="space-y-4 animate-fade-in" data-testid="member-observations">
      <h2 className="font-heading text-lg font-semibold">Observaciones</h2>

      {/* Add Observation (visible for admins viewing member, or members themselves) */}
      <div className="bg-white rounded-2xl p-5 border border-border">
        <Textarea
          value={newObs}
          onChange={e => setNewObs(e.target.value)}
          placeholder="Agregar una observacion..."
          rows={3}
          className="rounded-xl mb-3"
          data-testid="observation-input"
        />
        <Button onClick={addObservation} disabled={adding || !newObs.trim()} className="rounded-xl" data-testid="add-observation-btn">
          {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Agregar Observacion
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></div>
      ) : observations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin observaciones</h3>
          <p className="text-sm text-muted-foreground">Las observaciones sobre la cuenta apareceran aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map((obs, i) => (
            <div key={obs._id} className="bg-white rounded-2xl p-4 border border-border" data-testid={`observation-${i}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-line">{obs.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(obs.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {obs.created_by && <span>por {obs.created_by}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => deleteObs(obs._id)} className="text-destructive shrink-0" data-testid={`delete-obs-${i}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
