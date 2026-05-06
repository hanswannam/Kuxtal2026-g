import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy, MessageCircle, Mail, LogIn, X, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

function buildMemberMessage({ name, contract_number, dpi, site }) {
  return (
    `Hola ${name || ''}, te damos la bienvenida a Kuxtal Travels 🌎✨\n\n` +
    `Estos son tus accesos al portal de socios:\n` +
    `• Sitio: ${site}/login\n` +
    `• Número de contrato: ${contract_number}\n` +
    `• Contraseña (DPI): ${dpi}\n\n` +
    `Cualquier duda estamos a tu disposición.`
  );
}

function buildCommerceMessage({ name, commerce_id, validation_code, site }) {
  return (
    `Hola ${name || ''} 👋\n\n` +
    `Bienvenido al programa de Aliados Kuxtal Travels. Estos son tus accesos al portal de comercios:\n` +
    `• Sitio: ${site}/login\n` +
    `• ID de Comercio: ${commerce_id}\n` +
    `• Código de validación: ${validation_code}\n\n` +
    `Con estos datos podrás validar cupones QR y gestionar tu perfil.`
  );
}

function sanitizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D+/g, '');
  if (!digits) return '';
  // Guatemala default +502 if 8-digit local number
  if (digits.length === 8) return `502${digits}`;
  return digits;
}

export default function CredentialsModal({ open, onClose, subject, kind }) {
  // kind: 'member' | 'commerce'
  // subject: full member or commerce doc
  const [reveal, setReveal] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [copied, setCopied] = useState('');

  const site = (typeof window !== 'undefined') ? window.location.origin : '';

  const data = useMemo(() => {
    if (!subject) return null;
    if (kind === 'member') {
      return {
        title: 'Credenciales del Socio',
        name: subject.name,
        phone: subject.phone,
        email: subject.email,
        fields: [
          { label: 'Número de contrato', value: subject.contract_number, secret: false, testid: 'cred-contract' },
          { label: 'DPI (contraseña)', value: subject.dpi, secret: true, testid: 'cred-dpi' },
        ],
        message: buildMemberMessage({
          name: subject.name,
          contract_number: subject.contract_number,
          dpi: subject.dpi,
          site,
        }),
        impersonateUrl: `/auth/impersonate/member/${subject._id}`,
      };
    }
    return {
      title: 'Credenciales del Comercio',
      name: subject.name,
      phone: subject.phone,
      email: subject.email,
      fields: [
        { label: 'ID de comercio', value: subject._id, secret: false, testid: 'cred-commerce-id' },
        { label: 'Código de validación', value: subject.validation_code, secret: true, testid: 'cred-code' },
      ],
      message: buildCommerceMessage({
        name: subject.name,
        commerce_id: subject._id,
        validation_code: subject.validation_code,
        site,
      }),
      impersonateUrl: `/auth/impersonate/commerce/${subject._id}`,
    };
  }, [subject, kind, site]);

  if (!open || !data) return null;

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(''), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const openWhatsapp = () => {
    const phone = sanitizePhone(data.phone);
    if (!phone) {
      toast.error('El registro no tiene teléfono. Usa Copiar para enviarlo manualmente.');
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`;
    window.open(url, '_blank', 'noopener');
  };

  const openEmail = () => {
    if (!data.email) {
      toast.error('El registro no tiene email. Usa Copiar para enviarlo manualmente.');
      return;
    }
    const subjectText = encodeURIComponent('Tus accesos a Kuxtal Travels');
    const body = encodeURIComponent(data.message);
    window.location.href = `mailto:${data.email}?subject=${subjectText}&body=${body}`;
  };

  const impersonate = async () => {
    setImpersonating(true);
    try {
      const currentToken = localStorage.getItem('kuxtal_token');
      const r = await api.post(data.impersonateUrl);
      if (currentToken) {
        localStorage.setItem('kuxtal_admin_token', currentToken);
        localStorage.setItem('kuxtal_admin_return', window.location.pathname);
      }
      localStorage.setItem('kuxtal_token', r.data.token);
      toast.success(`Ingresando como ${r.data.name}`);
      // Hard redirect so AuthProvider re-runs /auth/me
      window.location.href = r.data.redirect || '/';
    } catch (e) {
      toast.error(e.response?.data?.detail || 'No se pudo ingresar como usuario');
      setImpersonating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      data-testid="credentials-modal"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading text-lg font-semibold">{data.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[22rem]">{data.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            data-testid="credentials-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {data.fields.map((f) => (
            <div key={f.label}>
              <Label className="text-xs">{f.label}</Label>
              <div className="flex items-stretch gap-2 mt-1">
                <Input
                  value={f.secret && !reveal ? '•'.repeat(Math.min(12, String(f.value || '').length || 6)) : (f.value || '')}
                  readOnly
                  className="rounded-xl font-mono text-sm"
                  data-testid={f.testid}
                />
                {f.secret && (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="rounded-xl shrink-0"
                    onClick={() => setReveal(r => !r)}
                    title={reveal ? 'Ocultar' : 'Mostrar'}
                    data-testid="cred-reveal-btn"
                  >
                    {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="rounded-xl shrink-0"
                  onClick={() => copy(f.value || '', f.label)}
                  title="Copiar"
                  data-testid={`copy-${f.testid}`}
                >
                  {copied === f.label ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-secondary/40 rounded-xl p-3 mb-5 border border-border">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Mensaje sugerido</Label>
            <button
              onClick={() => copy(data.message, 'message')}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              data-testid="copy-credentials-message"
            >
              {copied === 'message' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'message' ? 'Copiado' : 'Copiar mensaje completo'}
            </button>
          </div>
          <pre className="text-[11px] whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
            {data.message}
          </pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <Button
            onClick={openWhatsapp}
            className="rounded-full bg-[#25D366] hover:bg-[#1da851] text-white"
            data-testid="send-credentials-whatsapp"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button
            onClick={openEmail}
            variant="outline"
            className="rounded-full"
            data-testid="send-credentials-email"
          >
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          <Button
            onClick={() => copy(data.message, 'message')}
            variant="outline"
            className="rounded-full"
            data-testid="copy-credentials-all"
          >
            <Copy className="w-4 h-4 mr-2" /> Copiar todo
          </Button>
        </div>

        <Button
          onClick={impersonate}
          disabled={impersonating}
          className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
          data-testid="impersonate-btn"
        >
          <LogIn className="w-4 h-4 mr-2" />
          {impersonating ? 'Ingresando…' : `Ingresar al portal ${kind === 'member' ? 'del socio' : 'del comercio'}`}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Serás redirigido a su portal. Podrás volver al admin desde la barra superior.
        </p>
      </div>
    </div>
  );
}
