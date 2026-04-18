import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { QrCode, Camera, Keyboard, Check, X, Gift, User, Calendar, Clock, Loader2, AlertCircle, MapPin, History } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png";

export function CommerceCouponsTab({ commerceId, commerceName }) {
  const [mode, setMode] = useState('manual'); // manual | camera
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, [commerceId]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/commerce/${commerceId}/coupons`);
      setHistory(data);
    } catch (e) { console.error('Failed to load coupon history:', e); }
    setLoadingHistory(false);
  };

  const validateCode = async (code) => {
    if (!code.trim()) return;
    setValidating(true); setError(''); setCoupon(null);
    try {
      const { data } = await api.get(`/coupons/validate/${code.trim().toUpperCase()}`);
      setCoupon(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Cupon no encontrado');
    }
    setValidating(false);
  };

  const redeemCoupon = async () => {
    if (!coupon) return;
    setRedeeming(true);
    try {
      await api.post(`/coupons/redeem/${coupon.code}`, { commerce_name: commerceName });
      toast.success('Cupon canjeado exitosamente');
      validateCode(coupon.code);
      loadHistory();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al canjear'); }
    setRedeeming(false);
  };

  const startCamera = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (scannerInstanceRef.current) {
        try { await scannerInstanceRef.current.stop(); } catch (e) { console.warn('Scanner stop:', e); }
      }
      const scanner = new Html5Qrcode("commerce-qr-reader");
      scannerInstanceRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          // Extract code from URL or use directly
          let code = decodedText;
          const match = decodedText.match(/validate\/([A-Z0-9-]+)/i);
          if (match) code = match[1];
          scanner.stop().then(() => {
            scannerInstanceRef.current = null;
            setMode('manual');
            setManualCode(code.toUpperCase());
            validateCode(code);
            toast.success(`QR escaneado: ${code.toUpperCase()}`);
          }).catch(() => {});
        }
      );
    } catch (err) {
      toast.error('No se pudo acceder a la camara. Usa el modo manual.');
      setMode('manual');
    }
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try { await scannerInstanceRef.current.stop(); } catch (e) { console.warn('Scanner stop cleanup:', e); }
      scannerInstanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [mode, startCamera, stopCamera]);

  const activeHistory = history.filter(c => c.status === 'active');
  const usedHistory = history.filter(c => c.status === 'used');

  return (
    <div className="space-y-6 animate-fade-in" data-testid="commerce-coupons-tab">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a0f1a] to-[#1a0a0a] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-10 w-auto" />
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">Validar Cupones</h2>
            <p className="text-white/50 text-xs">Escanea el QR o ingresa el codigo del socio</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2" data-testid="coupon-mode-toggle">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'camera' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/10'
            }`}
            data-testid="coupon-mode-camera"
          >
            <Camera className="w-4 h-4" /> Escanear QR
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'manual' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/10'
            }`}
            data-testid="coupon-mode-manual"
          >
            <Keyboard className="w-4 h-4" /> Codigo Manual
          </button>
        </div>
      </div>

      {/* Camera Scanner */}
      {mode === 'camera' && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden" data-testid="qr-scanner-container">
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">Apunta la camara al codigo QR del socio</p>
            <div id="commerce-qr-reader" ref={scannerRef} className="max-w-[400px] mx-auto rounded-xl overflow-hidden" />
            <Button variant="outline" size="sm" onClick={() => setMode('manual')} className="mt-4 rounded-full">
              <Keyboard className="w-3 h-3 mr-2" /> Cambiar a modo manual
            </Button>
          </div>
        </div>
      )}

      {/* Manual Input */}
      {mode === 'manual' && (
        <div className="bg-white rounded-2xl p-5 border border-border" data-testid="manual-code-section">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Codigo del cupon</label>
          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              placeholder="KX-XXXXXX"
              className="rounded-xl font-mono text-lg tracking-wider h-12"
              onKeyDown={e => { if (e.key === 'Enter') validateCode(manualCode); }}
              data-testid="commerce-manual-code"
            />
            <Button
              onClick={() => validateCode(manualCode)}
              disabled={validating || !manualCode.trim()}
              className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shrink-0"
              data-testid="commerce-validate-btn"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
              {validating ? '' : 'Validar'}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3" data-testid="coupon-error">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Cupon no valido</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Coupon Result */}
      {coupon && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-lg" data-testid="coupon-result">
          {/* Status */}
          <div className={`p-4 text-center font-bold text-white ${coupon.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}>
            {coupon.status === 'active' ? (
              <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" /> CUPON VALIDO</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><X className="w-5 h-5" /> CUPON UTILIZADO</span>
            )}
          </div>

          {/* Code */}
          <div className="p-4 text-center border-b border-border">
            <p className="font-mono text-3xl font-bold text-primary tracking-widest">{coupon.code}</p>
          </div>

          {/* Discount */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <Gift className="w-7 h-7 text-amber-600 shrink-0" />
              <p className="font-bold text-amber-900">{coupon.discount_description}</p>
            </div>
          </div>

          {/* Member Info */}
          <div className="p-4 space-y-3">
            {coupon.member_name && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Socio</p>
                  <p className="font-semibold text-sm">{coupon.member_name} {coupon.member_contract ? `(${coupon.member_contract})` : ''}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="text-sm">{new Date(coupon.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            {coupon.used_at && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Canjeado</p>
                  <p className="text-sm">{new Date(coupon.used_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )}
            {coupon.visit_count > 0 && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Visitas anteriores</p>
                  <p className="text-sm font-semibold">{coupon.visit_count} visitas</p>
                </div>
              </div>
            )}
          </div>

          {/* Redeem */}
          {coupon.status === 'active' && (
            <div className="p-4 border-t border-border">
              <Button
                onClick={redeemCoupon}
                disabled={redeeming}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-base font-bold shadow-lg"
                data-testid="commerce-redeem-btn"
              >
                {redeeming ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                {redeeming ? 'Canjeando...' : 'Canjear Cupon'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden" data-testid="coupon-history">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading text-base font-semibold">Historial de Cupones</h3>
          <Badge variant="secondary" className="rounded-full text-xs ml-auto">{history.length} total</Badge>
        </div>
        {loadingHistory ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" /></div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Sin cupones registrados aun</div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {history.map((c, i) => (
              <div key={c._id} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors" data-testid={`history-coupon-${i}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{c.code}</span>
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="rounded-full text-[10px]">
                      {c.status === 'active' ? 'Activo' : 'Usado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.member_name || 'Sin socio asignado'} &middot; {c.discount_description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(c.used_at || c.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
