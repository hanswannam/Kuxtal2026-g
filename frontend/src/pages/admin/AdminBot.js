import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Bot, Save, Send, Eye, EyeOff, Trash2, MessageSquare, Sparkles,
  Power, Copy, CheckCircle2, AlertCircle, BookOpen, Database, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

const NAVY = '#0D2B45';
const GOLD = '#D4AF5A';

const MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o-mini', desc: 'Recomendado · rápido y económico (~$0.15 / 1M tokens)' },
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'Más potente · mejor en respuestas complejas (~$5 / 1M tokens)' },
  { id: 'gpt-5.2', label: 'GPT-5.2', desc: 'Top of the line (más caro, más capaz)' },
  { id: 'gpt-5.1', label: 'GPT-5.1', desc: 'Excelente balance' },
];

export function AdminBot() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showKapso, setShowKapso] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  // form draft secrets (empty string = keep)
  const [openaiKeyDraft, setOpenaiKeyDraft] = useState('');
  const [kapsoKeyDraft, setKapsoKeyDraft] = useState('');
  const [secretDraft, setSecretDraft] = useState('');
  const [adminTokenDraft, setAdminTokenDraft] = useState('');
  const [showAdminToken, setShowAdminToken] = useState(false);
  // tester
  const [testInput, setTestInput] = useState('');
  const [testHistory, setTestHistory] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const testEndRef = useRef(null);
  // conversations
  const [conversations, setConversations] = useState([]);
  const [showConvs, setShowConvs] = useState(false);

  const webhookUrl = `${process.env.REACT_APP_BACKEND_URL}/api/webhooks/kapso/whatsapp`;

  useEffect(() => {
    api.get('/admin/bot/config').then(r => {
      setConfig(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testHistory]);

  const update = (patch) => setConfig(c => ({ ...c, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      // Solo mandamos campos editables (NUNCA los _masked / _set / metadata).
      // Para los secrets: solo mandamos el draft si el usuario lo pegó (sino vacío = backend preserva).
      const payload = {
        enabled: config.enabled,
        openai_model: config.openai_model,
        kapso_phone_number_id: config.kapso_phone_number_id || '',
        system_prompt: config.system_prompt,
        knowledge_base: config.knowledge_base || '',
        include_packages: !!config.include_packages,
        include_commerces: !!config.include_commerces,
        include_member_data: !!config.include_member_data,
        max_history: config.max_history || 10,
        external_api_base_url: config.external_api_base_url || '',
        public_site_url: config.public_site_url || '',
        // Drafts: empty = preserve current
        openai_api_key: openaiKeyDraft,
        kapso_api_key: kapsoKeyDraft,
        kapso_webhook_secret: secretDraft,
        external_admin_token: adminTokenDraft,
      };
      const r = await api.put('/admin/bot/config', payload);
      setConfig(r.data);
      setOpenaiKeyDraft('');
      setKapsoKeyDraft('');
      setSecretDraft('');
      setAdminTokenDraft('');
      toast.success('Configuración guardada');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    }
    setSaving(false);
  };

  const sendTest = async () => {
    const msg = testInput.trim();
    if (!msg) return;
    setTestHistory(h => [...h, { role: 'user', content: msg }]);
    setTestInput('');
    setTestLoading(true);
    try {
      const r = await api.post('/admin/bot/test', { message: msg, session_id: 'admin-test' });
      setTestHistory(h => [...h, { role: 'assistant', content: r.data.reply }]);
    } catch (e) {
      const detail = e.response?.data?.detail || 'Error de conexión con el bot';
      setTestHistory(h => [...h, { role: 'error', content: detail }]);
    }
    setTestLoading(false);
  };

  const loadConversations = async () => {
    try {
      const r = await api.get('/admin/bot/conversations');
      setConversations(r.data || []);
      setShowConvs(true);
    } catch {
      toast.error('No se pudieron cargar las conversaciones');
    }
  };

  const deleteConv = async (sessionId) => {
    if (!window.confirm('¿Eliminar esta conversación?')) return;
    try {
      await api.delete(`/admin/bot/conversations/${encodeURIComponent(sessionId)}`);
      setConversations(c => c.filter(x => x.session_id !== sessionId));
      toast.success('Conversación eliminada');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-bot">
      {/* Hero header */}
      <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #061829 100%)` }}>
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 90% 10%, ${GOLD} 0, transparent 40%)` }} />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>Asistente IA</p>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Bot className="w-7 h-7" style={{ color: GOLD }} />
              Bot de WhatsApp
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              Atiende a socios, comercios y prospectos por WhatsApp con tu propia API de OpenAI conectada vía Kapso.ai.
            </p>
          </div>
          <button
            onClick={() => update({ enabled: !config.enabled })}
            className={`flex items-center gap-2 px-5 h-11 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all ${
              config.enabled
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
            data-testid="bot-toggle-enabled"
          >
            <Power className="w-4 h-4" />
            {config.enabled ? 'Activo' : 'Apagado'}
          </button>
        </div>
      </div>

      {/* Status alerts */}
      {!config.openai_api_key_set && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3" data-testid="alert-openai">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Falta la API key de OpenAI</p>
            <p className="text-xs text-amber-800 mt-1">Pegala abajo para que el bot pueda responder. Conseguila en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline font-semibold">platform.openai.com/api-keys</a></p>
          </div>
        </div>
      )}

      {/* Layout 2 cols: config + tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============ CONFIG ============ */}
        <div className="space-y-6">
          {/* OpenAI */}
          <Section title="OpenAI" icon={Database} testid="bot-openai">
            <Field label="API key" hint="No se muestra después de guardarla.">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showOpenAI ? 'text' : 'password'}
                    value={openaiKeyDraft}
                    onChange={e => setOpenaiKeyDraft(e.target.value)}
                    placeholder={config.openai_api_key_set ? `Guardada · ${config.openai_api_key_masked} (dejá vacío para mantener)` : 'sk-proj-...'}
                    className="rounded-xl pr-10"
                    data-testid="openai-key-input"
                  />
                  <button type="button" onClick={() => setShowOpenAI(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {config.openai_api_key_set && (
                  <Badge variant="outline" className="rounded-full border-emerald-300 bg-emerald-50 text-emerald-700 px-3 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Set
                  </Badge>
                )}
              </div>
            </Field>
            <Field label="Modelo">
              <select
                value={config.openai_model}
                onChange={e => update({ openai_model: e.target.value })}
                className="w-full h-10 rounded-xl border border-input px-3 text-sm bg-white"
                data-testid="openai-model-select"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Kapso */}
          <Section title="Kapso.ai (WhatsApp)" icon={MessageSquare} testid="bot-kapso">
            <Field label="API key">
              <div className="relative">
                <Input
                  type={showKapso ? 'text' : 'password'}
                  value={kapsoKeyDraft}
                  onChange={e => setKapsoKeyDraft(e.target.value)}
                  placeholder={config.kapso_api_key_set ? `Guardada · ${config.kapso_api_key_masked}` : 'kapso_...'}
                  className="rounded-xl pr-10"
                  data-testid="kapso-key-input"
                />
                <button type="button" onClick={() => setShowKapso(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showKapso ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Phone Number ID" hint="El ID del número de WhatsApp en Kapso (Project Settings → Phone Numbers).">
              <Input
                value={config.kapso_phone_number_id}
                onChange={e => update({ kapso_phone_number_id: e.target.value })}
                placeholder="647015955153740"
                className="rounded-xl font-mono"
                data-testid="kapso-phone-id"
              />
            </Field>
            <Field label="Webhook secret" hint="El secret que generaste cuando creaste el webhook en Kapso. Lo usamos para verificar HMAC-SHA256.">
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={secretDraft}
                  onChange={e => setSecretDraft(e.target.value)}
                  placeholder={config.kapso_webhook_secret_set ? `Guardado · ${config.kapso_webhook_secret_masked}` : 'whsec_...'}
                  className="rounded-xl pr-10"
                  data-testid="kapso-secret-input"
                />
                <button type="button" onClick={() => setShowSecret(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Webhook URL (copiala en Kapso)">
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="rounded-xl font-mono text-xs bg-secondary/40" data-testid="kapso-webhook-url" />
                <Button type="button" variant="outline" onClick={() => copy(webhookUrl)} className="rounded-xl shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                En Kapso → Webhooks → Add Webhook → pegá esta URL, suscribite a <code className="font-mono bg-secondary px-1 rounded">whatsapp.message.received</code> y copiá el secret aquí arriba.
              </p>
            </Field>
          </Section>

          {/* Producción */}
          <Section title="Backend de producción / URL pública" icon={Database} testid="bot-prod">
            <Field label="URL pública del sitio (para los links que comparte el bot)" hint="Ejemplo: https://kuxtaltravelgt.com — el bot generará links como https://kuxtaltravelgt.com/trip/ID">
              <Input
                value={config.public_site_url || ''}
                onChange={e => update({ public_site_url: e.target.value })}
                placeholder="https://kuxtaltravelgt.com"
                className="rounded-xl font-mono"
                data-testid="public-site-url"
              />
            </Field>
            <p className="text-xs text-muted-foreground mb-3 mt-4">
              Si tu CRM real corre en otro deploy (ej. <code className="font-mono bg-secondary px-1 rounded">kuxtaltravelgt.com</code>), pegá aquí el URL del backend para que el bot lea paquetes y comercios reales en lugar de los del preview.
            </p>
            <Field label="URL del backend productivo (opcional)" hint="Sin barra final. Solo si tu backend está en otro dominio que el frontend público.">
              <Input
                value={config.external_api_base_url || ''}
                onChange={e => update({ external_api_base_url: e.target.value })}
                placeholder="https://kuxtaltravelgt.com"
                className="rounded-xl font-mono"
                data-testid="external-api-url"
              />
            </Field>
            <Field label="Admin token productivo (opcional, para identificar socios por WA)" hint="JWT de un admin del CRM productivo. Necesario solo si querés que el bot reconozca al socio por su número de teléfono.">
              <div className="relative">
                <Input
                  type={showAdminToken ? 'text' : 'password'}
                  value={adminTokenDraft}
                  onChange={e => setAdminTokenDraft(e.target.value)}
                  placeholder={config.external_admin_token_set ? `Guardado · ${config.external_admin_token_masked}` : 'eyJhbGciOiJIUzI1NiIs...'}
                  className="rounded-xl pr-10 font-mono text-xs"
                  data-testid="external-admin-token"
                />
                <button type="button" onClick={() => setShowAdminToken(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showAdminToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          </Section>

          {/* Knowledge sources */}
          <Section title="Base de conocimiento" icon={BookOpen} testid="bot-kb">
            <p className="text-xs text-muted-foreground mb-2">
              El bot recibe en cada respuesta: tu prompt + texto editable + datos automáticos de la plataforma según selecciones.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <Toggle
                checked={!!config.include_packages}
                onChange={v => update({ include_packages: v })}
                label="Paquetes"
                desc="Lista activa con precios y socio"
                testid="toggle-include-packages"
              />
              <Toggle
                checked={!!config.include_commerces}
                onChange={v => update({ include_commerces: v })}
                label="Comercios"
                desc="Aliados activos y beneficios"
                testid="toggle-include-commerces"
              />
              <Toggle
                checked={!!config.include_member_data}
                onChange={v => update({ include_member_data: v })}
                label="Datos del socio"
                desc="Si el WA matchea con un socio"
                testid="toggle-include-member"
              />
            </div>
            <Field label="Texto editable (FAQs, políticas, horarios, contactos…)" hint="Markdown soportado. Se inyecta tal cual al system prompt.">
              <Textarea
                value={config.knowledge_base}
                onChange={e => update({ knowledge_base: e.target.value })}
                rows={8}
                placeholder={`## Horarios de atención\nLunes a viernes 8-18h, sábados 9-13h.\n\n## Métodos de pago aceptados\nTransferencia, efectivo, tarjeta de crédito (cuotas sin interés).\n\n## Políticas\n- Cancelaciones hasta 30 días antes...`}
                className="rounded-xl font-mono text-xs leading-relaxed"
                data-testid="bot-knowledge-base"
              />
            </Field>
          </Section>

          {/* System prompt */}
          <Section title="System prompt" icon={Sparkles} testid="bot-prompt">
            <p className="text-xs text-muted-foreground mb-2">
              Define la personalidad, tono y reglas del bot. El bot también recibe automáticamente la base de conocimiento de arriba.
            </p>
            <Textarea
              value={config.system_prompt}
              onChange={e => update({ system_prompt: e.target.value })}
              rows={14}
              className="rounded-xl font-mono text-xs leading-relaxed"
              data-testid="bot-system-prompt"
            />
          </Section>

          <div className="flex justify-end gap-2 sticky bottom-4 z-10">
            <Button onClick={save} disabled={saving} className="rounded-full px-6 h-11 shadow-lg" data-testid="save-bot-config">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando…' : 'Guardar configuración'}
            </Button>
          </div>
        </div>

        {/* ============ TESTER ============ */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
          <Section title="Probador en vivo" icon={Sparkles} testid="bot-tester">
            <p className="text-xs text-muted-foreground mb-3">
              Charlá con el bot tal como lo haría un usuario por WhatsApp. Usa el prompt y conocimiento que estén guardados.
            </p>
            <div className="rounded-xl border border-border p-3 h-[420px] overflow-y-auto bg-secondary/30 space-y-3" data-testid="bot-test-chat">
              {testHistory.length === 0 && (
                <p className="text-center italic text-xs text-muted-foreground py-12">
                  Iniciá una conversación para probar el bot.
                </p>
              )}
              {testHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : m.role === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                        : 'bg-white border border-border rounded-tl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pensando…
                  </div>
                </div>
              )}
              <div ref={testEndRef} />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendTest(); }}
              className="mt-3 flex gap-2"
            >
              <Input
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder="Escribí un mensaje…"
                className="rounded-full"
                disabled={testLoading || !config.openai_api_key_set}
                data-testid="bot-test-input"
              />
              <Button type="submit" disabled={testLoading || !testInput.trim() || !config.openai_api_key_set} className="rounded-full shrink-0" data-testid="bot-test-send">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {!config.openai_api_key_set && (
              <p className="text-[11px] text-amber-700 mt-2">⚠ Configurá y guardá la API key de OpenAI primero para poder probar.</p>
            )}
            {testHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setTestHistory([])} className="mt-2 text-xs">
                Limpiar conversación
              </Button>
            )}
          </Section>

          {/* Conversations log */}
          <Section title="Conversaciones recientes" icon={MessageSquare} testid="bot-convs">
            {!showConvs ? (
              <Button variant="outline" onClick={loadConversations} className="rounded-full w-full" data-testid="load-conversations-btn">
                <Eye className="w-4 h-4 mr-2" /> Ver historial de conversaciones
              </Button>
            ) : (
              <div className="space-y-2">
                {conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">Sin conversaciones aún</p>
                )}
                {conversations.map(c => (
                  <div key={c.session_id} className="flex items-start justify-between gap-2 rounded-xl border border-border p-3 bg-white text-sm" data-testid={`conv-${c.session_id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{c.session_id}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.last_message || '—'}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{c.message_count} msgs</span>
                        <span>·</span>
                        <span>{c.channel || 'whatsapp'}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteConv(c.session_id)} className="text-red-500 hover:text-red-700 p-1" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={loadConversations} className="text-xs w-full">Refrescar</Button>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, testid, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border" data-testid={testid}>
      <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-3">
      <Label className="text-xs font-semibold mb-1 block">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc, testid }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`text-left rounded-xl border p-2.5 transition-all ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-border bg-white hover:bg-secondary/30'}`}
      data-testid={testid}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold">{label}</p>
        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-muted'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[1.1rem]' : 'translate-x-0.5'}`} />
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
    </button>
  );
}
