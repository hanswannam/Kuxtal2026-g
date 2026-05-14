import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Send, MessageCircle, Users, RefreshCw, Plus, X, Eye, AlertTriangle, CheckCircle2,
  Loader2, FileText, Smartphone, ExternalLink, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { formatApiError } from '../../lib/errors';

const NAVY = '#0D2B45';
const GOLD = '#B89327';

const AUDIENCE_OPTIONS = [
  { id: 'members_active', label: 'Socios activos', icon: Users },
  { id: 'members_all', label: 'Todos los socios', icon: Users },
  { id: 'clients_all', label: 'Todos los clientes', icon: Users },
  { id: 'custom_phones', label: 'Teléfonos personalizados', icon: Smartphone },
];

const STATUS_TONE = {
  queued: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En cola' },
  running: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Enviando…' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completada' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelada' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Falló' },
};

function ParamHint({ count }) {
  if (count === 0) return <p className="text-xs text-muted-foreground italic">Esta plantilla no tiene variables.</p>;
  return (
    <p className="text-xs text-muted-foreground">
      Llena {count} {count === 1 ? 'variable' : 'variables'} en orden (corresponden a <code className="text-[10px]">{'{{1}}, {{2}}…'}</code>).
    </p>
  );
}

function countBodyParams(template) {
  const body = (template?.components || []).find(c => (c.type || '').toUpperCase() === 'BODY');
  if (!body) return 0;
  const text = body.text || '';
  const matches = text.match(/\{\{\d+\}\}/g);
  return matches ? matches.length : 0;
}

function getBodyText(template) {
  const body = (template?.components || []).find(c => (c.type || '').toUpperCase() === 'BODY');
  return body?.text || '';
}

function renderPreview(template, params) {
  let text = getBodyText(template);
  (params || []).forEach((p, i) => {
    text = text.replaceAll(`{{${i + 1}}}`, p || `{{${i + 1}}}`);
  });
  return text;
}

export function AdminBroadcasts() {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');

  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [name, setName] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [bodyParams, setBodyParams] = useState([]);
  const [audienceType, setAudienceType] = useState('members_active');
  const [customPhonesText, setCustomPhonesText] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [sending, setSending] = useState(false);

  const [detailId, setDetailId] = useState('');
  const [detailData, setDetailData] = useState(null);

  const loadBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/broadcasts');
      setBroadcasts(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(formatApiError(e, 'No se pudieron cargar las difusiones'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError('');
      const { data } = await api.get('/broadcasts/templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      setTemplatesError(formatApiError(e, 'Error al cargar plantillas'));
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBroadcasts();
    loadTemplates();
  }, [loadBroadcasts, loadTemplates]);

  // Polling for running broadcasts
  useEffect(() => {
    const hasRunning = broadcasts.some(b => b.status === 'running' || b.status === 'queued');
    if (!hasRunning) return undefined;
    const t = setInterval(loadBroadcasts, 5000);
    return () => clearInterval(t);
  }, [broadcasts, loadBroadcasts]);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.name === selectedTemplateName && (t.language === selectedLanguage || templates.filter(x => x.name === selectedTemplateName).length === 1)),
    [templates, selectedTemplateName, selectedLanguage],
  );
  const autoParamCount = useMemo(() => countBodyParams(selectedTemplate), [selectedTemplate]);
  // In manual mode (no template metadata), trust bodyParams.length directly
  const paramCount = selectedTemplate ? autoParamCount : bodyParams.length;

  useEffect(() => {
    if (!selectedTemplate) return; // skip in manual mode
    setBodyParams(prev => {
      const out = [...prev];
      while (out.length < autoParamCount) out.push('');
      return out.slice(0, autoParamCount);
    });
  }, [autoParamCount, selectedTemplate]);

  const resetWizard = () => {
    setShowWizard(false);
    setName('');
    setSelectedTemplateName('');
    setBodyParams([]);
    setAudienceType('members_active');
    setCustomPhonesText('');
    setAudiencePreview(null);
  };

  const previewAudience = async () => {
    setPreviewing(true);
    try {
      const payload = {
        audience_type: audienceType,
        custom_phones: audienceType === 'custom_phones'
          ? customPhonesText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
          : null,
      };
      const { data } = await api.post('/broadcasts/preview', payload);
      setAudiencePreview(data);
    } catch (e) {
      toast.error(formatApiError(e, 'No se pudo calcular la audiencia'));
    }
    setPreviewing(false);
  };

  const sendBroadcast = async () => {
    if (!selectedTemplateName) { toast.error('Seleccioná una plantilla'); return; }
    if (!audiencePreview) { toast.error('Calculá la audiencia primero'); return; }
    if (audiencePreview.audience_size === 0) { toast.error('La audiencia está vacía'); return; }
    if (!window.confirm(`¿Confirmás enviar a ${audiencePreview.audience_size} destinatario(s)? Esto consumirá créditos de Meta y NO se puede deshacer una vez enviado.`)) return;

    setSending(true);
    try {
      const payload = {
        name: name.trim() || `Difusión ${new Date().toISOString().slice(0, 10)}`,
        template_name: selectedTemplateName,
        template_language: selectedLanguage,
        body_params: bodyParams,
        audience: {
          audience_type: audienceType,
          custom_phones: audienceType === 'custom_phones'
            ? customPhonesText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
            : null,
        },
      };
      await api.post('/broadcasts', payload);
      toast.success('Difusión iniciada — se envía en segundo plano.');
      resetWizard();
      await loadBroadcasts();
    } catch (e) {
      toast.error(formatApiError(e, 'Error al iniciar la difusión'));
    }
    setSending(false);
  };

  const openDetail = async (id) => {
    setDetailId(id);
    setDetailData(null);
    try {
      const { data } = await api.get(`/broadcasts/${id}`);
      setDetailData(data);
    } catch (e) {
      toast.error(formatApiError(e, 'No se pudo cargar el detalle'));
    }
  };

  const cancelBroadcast = async (id) => {
    if (!window.confirm('¿Cancelar esta difusión? Los mensajes ya enviados no se revertirán.')) return;
    try {
      await api.post(`/broadcasts/${id}/cancel`);
      toast.success('Difusión cancelada');
      await loadBroadcasts();
    } catch (e) {
      toast.error(formatApiError(e, 'No se pudo cancelar'));
    }
  };

  const approvedTemplates = templates.filter(t => (t.status || '').toUpperCase() === 'APPROVED');
  const templatesByName = useMemo(() => {
    const m = {};
    approvedTemplates.forEach(t => {
      if (!m[t.name]) m[t.name] = [];
      m[t.name].push(t.language);
    });
    return m;
  }, [approvedTemplates]);

  return (
    <div className="space-y-6" data-testid="admin-broadcasts">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight" style={{ color: NAVY }}>
            <MessageCircle className="inline w-5 h-5 mr-1.5" style={{ color: GOLD }} />
            Difusiones WhatsApp
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Envía mensajes masivos a socios o clientes con <strong>plantillas pre-aprobadas por Meta</strong>. Cumple las reglas de Meta: opt-in, throttling y opt-out automático para no bloquear tu número.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTemplates} variant="outline" size="sm" className="rounded-full" data-testid="reload-templates-btn">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Plantillas
          </Button>
          <Button onClick={() => setShowWizard(true)} className="rounded-full" style={{ background: NAVY }} data-testid="new-broadcast-btn">
            <Plus className="w-4 h-4 mr-1.5" /> Nueva difusión
          </Button>
        </div>
      </div>

      {/* Compliance notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3" data-testid="compliance-notice">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">Reglas de Meta para no bloquear el número:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Solo se envía a contactos con <strong>opt-in</strong> (no opt-out registrado).</li>
            <li>Se envía 1 mensaje cada {1.2}s para respetar el límite de Meta.</li>
            <li>Si un cliente responde <code>STOP</code>, <code>BAJA</code> o <code>CANCELAR</code>, se marca opt-out automáticamente.</li>
            <li>Solo se usan plantillas pre-aprobadas (no se permite enviar texto libre a alguien que no escribió en 24h).</li>
            <li>Tier inicial de Meta: 250 destinatarios únicos/día. Sube con buen comportamiento.</li>
          </ul>
        </div>
      </div>

      {/* Templates summary */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Plantillas aprobadas <Badge variant="outline" className="ml-2">{approvedTemplates.length}</Badge></h3>
        </div>
        {templatesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando plantillas…</div>
        ) : templatesError ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="templates-error">
            <p className="font-semibold mb-1">No se pudieron cargar las plantillas:</p>
            <p className="text-xs">{templatesError}</p>
            <p className="text-xs mt-2">Asegurate de tener Kapso configurado en <strong>Admin → Bot WA</strong> y de haber creado plantillas aprobadas en Meta Business Manager (categoría MARKETING o UTILITY).</p>
          </div>
        ) : approvedTemplates.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-secondary/40 rounded-lg p-4">
            <p className="font-semibold text-foreground mb-1">Aún no tienes plantillas aprobadas.</p>
            <p className="text-xs mb-2">Para enviar difusiones necesitás crear plantillas en Meta Business Manager (o desde tu dashboard de Kapso) y esperar la aprobación.</p>
            <p className="text-xs"><strong>Plantillas sugeridas para Kuxtal:</strong></p>
            <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
              <li><code>boletin_mensual</code> (MARKETING) — Hola {'{{1}}'}, te compartimos los destinos destacados del mes…</li>
              <li><code>nuevo_destino</code> (MARKETING) — Hola {'{{1}}'}, lanzamos {'{{2}}'} con precio especial para socios. Más info: {'{{3}}'}</li>
              <li><code>recordatorio_cotizacion</code> (UTILITY) — Hola {'{{1}}'}, tu cotización #{'{{2}}'} vence el {'{{3}}'}. Reservá antes para asegurar el precio.</li>
            </ul>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(templatesByName).map(([tplName, langs]) => {
              const sample = approvedTemplates.find(t => t.name === tplName);
              return (
                <div key={tplName} className="rounded-xl border border-border p-3 bg-secondary/20" data-testid={`template-card-${tplName}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono font-semibold" style={{ color: NAVY }}>{tplName}</code>
                    <Badge className="text-[9px] uppercase" variant="outline">{sample?.category || ''}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Idiomas: {langs.join(', ')}</p>
                  <p className="text-[11px] line-clamp-2 mt-1 italic">{getBodyText(sample)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Broadcast list */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Historial de difusiones
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </h3>
        {broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6">Aún no has enviado difusiones.</p>
        ) : (
          <div className="space-y-2">
            {broadcasts.map(b => {
              const tone = STATUS_TONE[b.status] || STATUS_TONE.queued;
              return (
                <div key={b.id || b._id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/20 transition" data-testid={`broadcast-${b.id || b._id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{b.name}</p>
                      <Badge className={`text-[10px] ${tone.bg} ${tone.text} border-0`}>{tone.label}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      <code>{b.template_name}</code> · {b.total_recipients} destinatarios · creada por {b.created_by_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ✓ {b.sent} enviados · 📬 {b.delivered} entregados · 👁 {b.read} leídos · ✗ {b.failed} fallidos
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openDetail(b._id)} data-testid={`detail-${b._id}`}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {(b.status === 'running' || b.status === 'queued') && (
                      <Button size="sm" variant="ghost" onClick={() => cancelBroadcast(b._id)} className="text-red-700" data-testid={`cancel-${b._id}`}>
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wizard modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={resetWizard}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="broadcast-wizard">
            <div className="sticky top-0 bg-white border-b border-border px-5 py-3 flex items-center justify-between">
              <h3 className="font-heading font-semibold">Nueva difusión WhatsApp</h3>
              <Button variant="ghost" size="sm" onClick={resetWizard}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-semibold">Nombre interno (solo para tu organización)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Promo Cartagena Diciembre" className="rounded-xl mt-1" data-testid="broadcast-name-input" />
              </div>

              <div>
                <Label className="text-xs font-semibold">Plantilla aprobada *</Label>
                {approvedTemplates.length === 0 ? (
                  <div className="space-y-2 mt-1">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                      No se pudo cargar la lista automática. Podés escribir el <strong>nombre exacto</strong> de la plantilla aprobada en Meta + idioma.
                    </div>
                    <Input
                      value={selectedTemplateName}
                      onChange={e => setSelectedTemplateName(e.target.value.trim())}
                      placeholder="ej: boletin_mensual"
                      className="rounded-xl font-mono"
                      data-testid="template-name-manual"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={selectedLanguage}
                        onChange={e => setSelectedLanguage(e.target.value.trim() || 'es')}
                        placeholder="Código de idioma (ej: es, es_MX, en_US)"
                        className="rounded-xl font-mono"
                        data-testid="template-lang-manual"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={bodyParams.length}
                        onChange={e => {
                          const n = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                          setBodyParams(Array.from({ length: n }, (_, i) => bodyParams[i] || ''));
                        }}
                        placeholder="Cantidad de variables"
                        className="rounded-xl"
                        data-testid="template-vars-count"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-border px-3 py-2 mt-1 text-sm"
                    value={selectedTemplateName}
                    onChange={e => setSelectedTemplateName(e.target.value)}
                    data-testid="template-select"
                  >
                    <option value="">— Seleccionar —</option>
                    {Object.keys(templatesByName).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedTemplateName && (templatesByName[selectedTemplateName] || []).length > 1 && (
                <div>
                  <Label className="text-xs font-semibold">Idioma</Label>
                  <select
                    className="w-full rounded-xl border border-border px-3 py-2 mt-1 text-sm"
                    value={selectedLanguage}
                    onChange={e => setSelectedLanguage(e.target.value)}
                  >
                    {(templatesByName[selectedTemplateName] || []).map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTemplate && (
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>Cuerpo de la plantilla</p>
                  <p className="text-xs whitespace-pre-wrap font-mono">{getBodyText(selectedTemplate)}</p>
                  <ParamHint count={paramCount} />
                </div>
              )}

              {paramCount > 0 && (
                <div className="space-y-2">
                  {Array.from({ length: paramCount }).map((_, i) => (
                    <div key={i}>
                      <Label className="text-xs">Variable {'{{'}{i + 1}{'}}'}</Label>
                      <Input
                        value={bodyParams[i] || ''}
                        onChange={e => {
                          const next = [...bodyParams];
                          next[i] = e.target.value;
                          setBodyParams(next);
                        }}
                        className="rounded-xl mt-1"
                        data-testid={`param-${i}`}
                      />
                    </div>
                  ))}
                  {selectedTemplate && getBodyText(selectedTemplate) && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Vista previa</p>
                      <p className="text-xs whitespace-pre-wrap">{renderPreview(selectedTemplate, bodyParams)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <Label className="text-xs font-semibold">Audiencia</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {AUDIENCE_OPTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { setAudienceType(a.id); setAudiencePreview(null); }}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition ${
                        audienceType === a.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40'
                      }`}
                      data-testid={`audience-${a.id}`}
                    >
                      <a.icon className="w-3.5 h-3.5" />
                      {a.label}
                    </button>
                  ))}
                </div>

                {audienceType === 'custom_phones' && (
                  <Textarea
                    value={customPhonesText}
                    onChange={e => { setCustomPhonesText(e.target.value); setAudiencePreview(null); }}
                    placeholder="Un teléfono por línea (formato +50212345678)"
                    rows={4}
                    className="rounded-xl mt-2 font-mono text-xs"
                    data-testid="custom-phones-input"
                  />
                )}

                <Button onClick={previewAudience} variant="outline" size="sm" className="mt-3 rounded-full" disabled={previewing} data-testid="preview-audience-btn">
                  {previewing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                  Calcular audiencia
                </Button>

                {audiencePreview && (
                  <div className="mt-3 rounded-xl bg-sky-50 border border-sky-200 p-3 text-xs">
                    <p className="font-semibold mb-1" data-testid="audience-size">
                      <Users className="inline w-3.5 h-3.5 mr-1" /> {audiencePreview.audience_size} destinatario(s) válidos (opt-in activo, con teléfono)
                    </p>
                    <p className="text-muted-foreground">
                      <Clock className="inline w-3 h-3 mr-1" /> Duración estimada: ~{audiencePreview.estimated_duration_minutes} minutos (throttle: 1 msg cada {audiencePreview.throttle_seconds}s)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={resetWizard} className="rounded-full">Cancelar</Button>
              <Button
                onClick={sendBroadcast}
                disabled={!audiencePreview || audiencePreview.audience_size === 0 || sending || !selectedTemplateName}
                className="rounded-full"
                style={{ background: NAVY }}
                data-testid="send-broadcast-btn"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                Enviar a {audiencePreview?.audience_size || 0}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detailId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setDetailId(''); setDetailData(null); }}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="broadcast-detail">
            {!detailData ? (
              <div className="p-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <>
                <div className="sticky top-0 bg-white border-b border-border px-5 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-sm">{detailData.name}</h3>
                    <p className="text-[11px] text-muted-foreground"><code>{detailData.template_name}</code> · {detailData.total_recipients} destinatarios</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setDetailId(''); setDetailData(null); }}><X className="w-4 h-4" /></Button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Enviados</p>
                      <p className="text-xl font-bold text-emerald-700">{detailData.sent}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-sky-700 font-bold">Entregados</p>
                      <p className="text-xl font-bold text-sky-700">{detailData.delivered}</p>
                    </div>
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-violet-700 font-bold">Leídos</p>
                      <p className="text-xl font-bold text-violet-700">{detailData.read}</p>
                    </div>
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-red-700 font-bold">Fallidos</p>
                      <p className="text-xl font-bold text-red-700">{detailData.failed}</p>
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Mensajes ({(detailData.messages || []).length})</h4>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {(detailData.messages || []).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs border-b border-border/50 py-2">
                        <span className="font-mono">{m.phone}</span>
                        <span className="text-muted-foreground truncate flex-1">{m.name}</span>
                        <Badge variant="outline" className="text-[9px]">{m.status}</Badge>
                        {m.error && <span className="text-[10px] text-red-700 truncate max-w-[200px]" title={m.error}>{m.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
