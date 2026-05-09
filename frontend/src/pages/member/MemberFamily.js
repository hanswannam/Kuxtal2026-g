import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Users, Eye, EyeOff, Copy, Check, AlertCircle, MessageCircle, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { MembershipCard } from '../../components/MembershipCard';
import { toast } from 'sonner';
import api from '../../lib/api';

const GOLD = '#D4AF37';
const GOLD_DEEP = '#B89327';
const NAVY = '#0D2B45';

const RELATIONSHIPS = [
  { value: 'esposo/a', label: 'Esposo/a' },
  { value: 'hijo/a', label: 'Hijo/a' },
  { value: 'padre/madre', label: 'Padre/Madre' },
  { value: 'hermano/a', label: 'Hermano/a' },
  { value: 'familiar', label: 'Otro familiar' },
];

const EMPTY = { name: '', dpi: '', relationship: 'familiar', phone: '', email: '', birth_date: '' };

function FamilyForm({ initial, contractNumber, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  useEffect(() => { setForm(initial || EMPTY); }, [initial]);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dpi.trim()) {
      toast.error('Nombre y DPI son obligatorios');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3" data-testid="family-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nombre completo *</Label>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
            className="rounded-xl mt-1"
            data-testid="family-name-input"
          />
        </div>
        <div>
          <Label className="text-xs">DPI (será su contraseña) *</Label>
          <Input
            value={form.dpi}
            onChange={e => set('dpi', e.target.value.replace(/\D/g, ''))}
            required
            placeholder="13 dígitos"
            className="rounded-xl mt-1 font-mono"
            data-testid="family-dpi-input"
          />
        </div>
        <div>
          <Label className="text-xs">Parentesco</Label>
          <select
            value={form.relationship}
            onChange={e => set('relationship', e.target.value)}
            className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm bg-white"
            data-testid="family-relationship-select"
          >
            {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Teléfono</Label>
          <Input
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+502 5555-1234"
            className="rounded-xl mt-1"
            data-testid="family-phone-input"
          />
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="rounded-xl mt-1"
            data-testid="family-email-input"
          />
        </div>
        <div>
          <Label className="text-xs">Fecha de nacimiento</Label>
          <Input
            type="date"
            value={form.birth_date}
            onChange={e => set('birth_date', e.target.value)}
            className="rounded-xl mt-1"
            data-testid="family-birth-input"
          />
        </div>
      </div>

      <div
        className="rounded-xl p-3 text-xs flex items-start gap-2"
        style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.35)', color: NAVY }}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD_DEEP }} />
        <span>
          El familiar podrá iniciar sesión en el portal con el contrato <strong>#{contractNumber}</strong> y su DPI como contraseña.
        </span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-full" data-testid="family-cancel-btn">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-full text-white"
          style={{ background: NAVY }}
          data-testid="family-save-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

function sanitizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.length === 8) return `502${digits}`;
  return digits;
}

function CredentialsBlock({ family, contractNumber }) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState('');
  const site = (typeof window !== 'undefined') ? window.location.origin : '';

  const message =
    `Hola ${family.name}, ya puedes ingresar al portal de socios de Kuxtal Travels.\n\n` +
    `• Sitio: ${site}/login\n` +
    `• Número de contrato: ${contractNumber}\n` +
    `• Contraseña (DPI): ${family.dpi}`;

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('Copiado');
      setTimeout(() => setCopied(''), 1500);
    } catch { toast.error('No se pudo copiar'); }
  };

  return (
    <div
      className="mt-3 rounded-xl p-3"
      style={{ background: 'rgba(13,43,69,0.04)', border: '1px solid rgba(212,175,55,0.30)' }}
      data-testid="family-credentials"
    >
      <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: GOLD_DEEP }}>
        Credenciales de acceso
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted-foreground shrink-0">Contrato:</span>
          <span className="font-mono font-semibold truncate" style={{ color: NAVY }}>{contractNumber}</span>
          <button onClick={() => copy(contractNumber, `c-${family._id}`)} className="ml-auto p-1 rounded hover:bg-muted" title="Copiar contrato" data-testid={`copy-contract-${family._id}`}>
            {copied === `c-${family._id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted-foreground shrink-0">DPI:</span>
          <span className="font-mono font-semibold truncate" style={{ color: NAVY }}>
            {reveal ? family.dpi : '•'.repeat(Math.min(family.dpi?.length || 6, 13))}
          </span>
          <button onClick={() => setReveal(r => !r)} className="ml-auto p-1 rounded hover:bg-muted" title={reveal ? 'Ocultar' : 'Mostrar'} data-testid={`reveal-dpi-${family._id}`}>
            {reveal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
          <button onClick={() => copy(family.dpi, `d-${family._id}`)} className="p-1 rounded hover:bg-muted" title="Copiar DPI" data-testid={`copy-dpi-${family._id}`}>
            {copied === `d-${family._id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <button
        onClick={() => copy(message, `m-${family._id}`)}
        className="mt-2 text-[11px] hover:underline inline-flex items-center gap-1"
        style={{ color: GOLD_DEEP }}
        data-testid={`copy-msg-${family._id}`}
      >
        {copied === `m-${family._id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied === `m-${family._id}` ? 'Mensaje copiado' : 'Copiar mensaje completo para enviarle'}
      </button>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={() => {
            const phone = sanitizePhone(family.phone);
            if (!phone) {
              toast.error('Este familiar no tiene teléfono. Edítalo o copia el mensaje.');
              return;
            }
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
          }}
          className="inline-flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-semibold text-white transition-colors"
          style={{ background: '#25D366' }}
          data-testid={`whatsapp-family-${family._id}`}
        >
          <MessageCircle className="w-3.5 h-3.5" /> Enviar por WhatsApp
        </button>
        <button
          onClick={() => {
            if (!family.email) {
              toast.error('Este familiar no tiene email. Edítalo o copia el mensaje.');
              return;
            }
            const subjectText = encodeURIComponent('Tus accesos a Kuxtal Travels');
            const body = encodeURIComponent(message);
            window.location.href = `mailto:${family.email}?subject=${subjectText}&body=${body}`;
          }}
          className="inline-flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-semibold border transition-colors hover:bg-muted"
          style={{ borderColor: 'rgba(212,175,55,0.45)', color: NAVY }}
          data-testid={`email-family-${family._id}`}
        >
          <Mail className="w-3.5 h-3.5" /> Enviar por email
        </button>
      </div>
    </div>
  );
}

export function MemberFamily({ member, isFamilyMember }) {
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const memberId = member?._id;
  const contractNumber = member?.contract_number || '---';
  const memberStart = member?.membership_start || member?.contract_date;
  const memberEnd = member?.membership_end || member?.termination_date;

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const r = await api.get(`/members/${memberId}/family`);
      setFamily(r.data || []);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'No se pudieron cargar los familiares');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    setSaving(true);
    try {
      if (editing?._id) {
        await api.put(`/members/${memberId}/family/${editing._id}`, form);
        toast.success('Familiar actualizado');
      } else {
        await api.post(`/members/${memberId}/family`, form);
        toast.success('Familiar agregado');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const removeFamily = async (f) => {
    if (!window.confirm(`¿Eliminar a ${f.name}? Se cerrará su acceso al portal.`)) return;
    try {
      await api.delete(`/members/${memberId}/family/${f._id}`);
      toast.success('Familiar eliminado');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al eliminar');
    }
  };

  if (isFamilyMember) {
    return (
      <div
        className="rounded-2xl p-8 text-center animate-fade-in"
        style={{ background: '#fff', border: '1px solid rgba(212,175,55,0.30)' }}
        data-testid="family-blocked-view"
      >
        <Users className="w-10 h-10 mx-auto mb-3" style={{ color: GOLD_DEEP }} />
        <p className="font-heading text-lg font-semibold mb-1" style={{ color: NAVY }}>
          Solo el socio principal puede gestionar familiares
        </p>
        <p className="text-sm text-muted-foreground">
          Pídele al titular del contrato que administre los accesos familiares.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="member-family-page">
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: '#fff', border: '1px solid rgba(212,175,55,0.30)', boxShadow: '0 10px 30px -22px rgba(184,147,39,0.4)' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold" style={{ color: NAVY }}>
              <span style={{ color: GOLD_DEEP }}>·</span> Mis familiares
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crea accesos para tus familiares. Ellos podrán entrar con el contrato <strong>#{contractNumber}</strong> y su propio DPI.
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="rounded-full text-white"
              style={{ background: NAVY }}
              data-testid="add-family-btn"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Agregar familiar
            </Button>
          )}
        </div>

        {showForm && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: '#FDF9EC', border: '1px solid rgba(212,175,55,0.30)' }}
            data-testid="family-form-wrapper"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm" style={{ color: NAVY }}>
                {editing ? 'Editar familiar' : 'Nuevo familiar'}
              </p>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded hover:bg-muted" data-testid="family-form-close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <FamilyForm
              initial={editing}
              contractNumber={contractNumber}
              onSave={save}
              onCancel={() => { setShowForm(false); setEditing(null); }}
              saving={saving}
            />
          </div>
        )}

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD_DEEP }} /></div>
        ) : family.length === 0 && !showForm ? (
          <div className="py-10 text-center" data-testid="family-empty">
            <Users className="w-10 h-10 mx-auto mb-2" style={{ color: GOLD_DEEP, opacity: 0.5 }} />
            <p className="text-sm text-muted-foreground">Aún no has agregado familiares.</p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="family-list">
            {family.map((f, i) => (
              <div
                key={f._id}
                className="rounded-xl p-4"
                style={{ background: 'linear-gradient(135deg, #FDF9EC 0%, #FAF3DD 100%)', border: '1px solid rgba(212,175,55,0.35)' }}
                data-testid={`family-item-${i}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base" style={{ color: NAVY }}>{f.name}</p>
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                        style={{ color: GOLD_DEEP, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)' }}
                      >
                        {f.relationship || 'familiar'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-xs text-muted-foreground">
                      {f.phone && <span>📞 {f.phone}</span>}
                      {f.email && <span className="truncate">✉ {f.email}</span>}
                      {f.birth_date && <span>🎂 {f.birth_date}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditing(f); setShowForm(true); }}
                      title="Editar"
                      data-testid={`edit-family-${i}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFamily(f)}
                      className="text-red-700 hover:bg-red-50"
                      title="Eliminar"
                      data-testid={`delete-family-${i}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex justify-center sm:justify-start" data-testid={`family-card-${i}`}>
                  <MembershipCard
                    name={f.name}
                    contractNumber={contractNumber}
                    startDate={memberStart}
                    endDate={memberEnd}
                    tier="Co Propietario"
                    subtitle="Familiar autorizado"
                    downloadFilename={`tarjeta_kuxtal_copropietario_${(f.name || 'familiar').replace(/\s+/g,'_')}.png`}
                  />
                </div>

                <CredentialsBlock family={f} contractNumber={contractNumber} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
