import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Gift, Store, QrCode, Check, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_vacation-club-portal/artifacts/s1oay7h5_Kuxtal%20Club.png";
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export function MemberCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commerces, setCommerces] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showQR, setShowQR] = useState(null); // coupon code to show QR
  const [selectedCommerce, setSelectedCommerce] = useState('');

  useEffect(() => {
    loadCoupons();
    api.get('/commerce').then(r => setCommerces(r.data)).catch(e => console.error('Failed to load commerces:', e));
  }, []);

  const loadCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/my');
      setCoupons(data);
    } catch (e) { console.error('Failed to load coupons:', e); }
    setLoading(false);
  };

  const generateCoupon = async () => {
    if (!selectedCommerce) return toast.error('Selecciona un comercio');
    setGenerating(true);
    try {
      const { data } = await api.post('/coupons/generate', { commerce_id: selectedCommerce });
      toast.success(`Cupon generado: ${data.code}`);
      setShowQR(data.code);
      setSelectedCommerce('');
      loadCoupons();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al generar cupon'); }
    setGenerating(false);
  };

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const usedCoupons = coupons.filter(c => c.status === 'used');

  return (
    <div className="space-y-6 animate-fade-in" data-testid="member-coupons">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a0f1a] to-[#1a0a0a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-12 w-auto" />
          <div>
            <h2 className="font-heading text-lg font-semibold">Mis Cupones Digitales</h2>
            <p className="text-white/50 text-xs">Genera y presenta tu cupon QR en comercios aliados</p>
          </div>
        </div>

        {/* Generate Coupon */}
        <div className="flex gap-2">
          <select
            value={selectedCommerce}
            onChange={e => setSelectedCommerce(e.target.value)}
            className="flex-1 h-10 rounded-xl bg-white/10 border border-white/20 text-white px-3 text-sm"
            data-testid="coupon-commerce-select"
          >
            <option value="" className="text-black">Selecciona un comercio...</option>
            {commerces.map(c => (
              <option key={c._id} value={c._id} className="text-black">{c.name} - {c.category}</option>
            ))}
          </select>
          <Button
            onClick={generateCoupon}
            disabled={generating || !selectedCommerce}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold shrink-0"
            data-testid="generate-coupon-btn"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
            Generar
          </Button>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="qr-modal">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center">
            <div className="flex justify-end mb-2">
              <button onClick={() => setShowQR(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <img src={CLUB_LOGO} alt="Kuxtal Club" className="h-10 w-auto mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold mb-1">Tu Cupon QR</h3>
            <p className="text-sm text-muted-foreground mb-6">Presenta este codigo en el comercio</p>
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-primary/30 inline-block mb-4">
              <QRCodeSVG
                value={`${BASE_URL}/validate/${showQR}`}
                size={200}
                level="H"
                includeMargin={true}
                data-testid="qr-code-svg"
              />
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-widest mb-2" data-testid="qr-code-text">{showQR}</p>
            <p className="text-xs text-muted-foreground">Escanea el QR o dicta el codigo al comercio</p>
          </div>
        </div>
      )}

      {/* Active Coupons */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></div>
      ) : (
        <>
          {activeCoupons.length > 0 && (
            <div>
              <h3 className="font-heading text-base font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" /> Cupones Activos ({activeCoupons.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCoupons.map((c, i) => (
                  <div key={c._id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all" data-testid={`active-coupon-${i}`}>
                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-lg font-bold text-primary">{c.code}</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full text-xs">Activo</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-muted-foreground" />{c.commerce_name}</p>
                      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-3">{c.discount_description}</p>
                      <Button size="sm" onClick={() => setShowQR(c.code)} className="w-full rounded-xl bg-primary hover:bg-primary/90" data-testid={`show-qr-${i}`}>
                        <QrCode className="w-4 h-4 mr-2" /> Ver QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usedCoupons.length > 0 && (
            <div>
              <h3 className="font-heading text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" /> Cupones Usados ({usedCoupons.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {usedCoupons.map((c, i) => (
                  <div key={c._id} className="bg-white rounded-2xl border border-border overflow-hidden opacity-60" data-testid={`used-coupon-${i}`}>
                    <div className="h-1.5 bg-gray-300" />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-lg font-bold text-muted-foreground line-through">{c.code}</span>
                        <Badge variant="secondary" className="rounded-full text-xs">Usado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Store className="w-3.5 h-3.5" />{c.commerce_name}</p>
                      {c.used_at && <p className="text-xs text-muted-foreground mt-1"><Check className="w-3 h-3 inline mr-1" />Canjeado: {new Date(c.used_at).toLocaleDateString('es')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coupons.length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-border text-center">
              <QrCode className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-2">Sin cupones aun</h3>
              <p className="text-sm text-muted-foreground">Selecciona un comercio arriba y genera tu primer cupon</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
