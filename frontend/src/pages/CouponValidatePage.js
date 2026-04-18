import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Check, X, Gift, Store, User, Calendar, Clock, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API = process.env.REACT_APP_BACKEND_URL;
const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png";

export default function CouponValidatePage() {
  const { code } = useParams();
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [manualCode, setManualCode] = useState(code || '');
  useDocumentTitle('Validar Cupon');

  const loadCoupon = async (couponCode) => {
    if (!couponCode) return;
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(`${API}/api/coupons/validate/${couponCode}`);
      setCoupon(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Cupon no encontrado');
      setCoupon(null);
    }
    setLoading(false);
  };

  useEffect(() => { if (code) loadCoupon(code); else setLoading(false); }, [code]);

  const redeemCoupon = async () => {
    if (!coupon) return;
    setRedeeming(true);
    try {
      await axios.post(`${API}/api/coupons/redeem/${coupon.code}`, { commerce_name: coupon.commerce_name });
      toast.success('Cupon canjeado exitosamente');
      loadCoupon(coupon.code);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al canjear'); }
    setRedeeming(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#1a0a0a] flex items-center justify-center p-4" data-testid="coupon-validate-page">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-16 w-auto mx-auto mb-3" />
          <h1 className="text-white font-heading text-2xl font-bold">Validar Cupon</h1>
        </div>

        {/* Manual Code Input (when no code in URL) */}
        {!code && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-6 border border-white/10">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">Codigo del cupon</label>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                placeholder="KX-XXXXXX"
                className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono text-lg tracking-wider"
                data-testid="manual-code-input"
              />
              <Button onClick={() => loadCoupon(manualCode)} disabled={!manualCode.trim() || loading} className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold shrink-0" data-testid="manual-validate-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && code && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-sm">Validando cupon...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold text-lg mb-1">Cupon no valido</h2>
            <p className="text-red-300/80 text-sm">{error}</p>
          </div>
        )}

        {/* Coupon Found */}
        {coupon && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" data-testid="coupon-details">
            {/* Status Header */}
            <div className={`p-4 text-center ${coupon.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}>
              {coupon.status === 'active' ? (
                <div className="flex items-center justify-center gap-2 text-white">
                  <Check className="w-6 h-6" />
                  <span className="font-bold text-lg">CUPON VALIDO</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-white">
                  <X className="w-6 h-6" />
                  <span className="font-bold text-lg">CUPON UTILIZADO</span>
                </div>
              )}
            </div>

            {/* Code */}
            <div className="p-5 text-center border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Codigo</p>
              <p className="font-mono text-3xl font-bold text-primary tracking-widest" data-testid="coupon-code-display">{coupon.code}</p>
            </div>

            {/* Discount */}
            <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-900 text-lg">{coupon.discount_description}</p>
                  <p className="text-xs text-amber-700">Beneficio exclusivo Kuxtal Club</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Comercio</p>
                  <p className="font-semibold">{coupon.commerce_name}</p>
                </div>
              </div>
              {coupon.member_name && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Socio</p>
                    <p className="font-semibold">{coupon.member_name} {coupon.member_contract ? `(${coupon.member_contract})` : ''}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Creado</p>
                  <p className="text-sm">{new Date(coupon.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              {coupon.used_at && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Canjeado</p>
                    <p className="text-sm">{new Date(coupon.used_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )}

              {/* Visit History */}
              {coupon.visit_count > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Historial de visitas ({coupon.visit_count})</p>
                  <div className="space-y-1">
                    {coupon.visit_history?.map((v, i) => (
                      <div key={`visit-${i}`} className="text-xs text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {new Date(v.visited_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {v.coupon_code && <Badge variant="secondary" className="text-[9px] rounded-full">{v.coupon_code}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Redeem Button */}
            {coupon.status === 'active' && (
              <div className="p-5 border-t border-border">
                <Button
                  onClick={redeemCoupon}
                  disabled={redeeming}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-base font-bold shadow-lg"
                  data-testid="redeem-coupon-btn"
                >
                  {redeeming ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                  {redeeming ? 'Canjeando...' : 'Canjear Cupon'}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2">El cupon se marcara como utilizado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
