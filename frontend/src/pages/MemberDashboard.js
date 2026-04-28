import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { FileText, Bell, MessageSquare, Package, Store, Share2, Loader2, QrCode, Gift, Building2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const MemberOverview = lazy(() => import('./member/MemberOverview').then(m => ({ default: m.MemberOverview })));
const MemberQuotations = lazy(() => import('./member/MemberQuotations').then(m => ({ default: m.MemberQuotations })));
const MemberAnnouncements = lazy(() => import('./member/MemberAnnouncements').then(m => ({ default: m.MemberAnnouncements })));
const MemberRequests = lazy(() => import('./member/MemberRequests').then(m => ({ default: m.MemberRequests })));
const MemberReferrals = lazy(() => import('./member/MemberReferrals').then(m => ({ default: m.MemberReferrals })));
const MemberBenefits = lazy(() => import('./member/MemberBenefits').then(m => ({ default: m.MemberBenefits })));
const MemberCoupons = lazy(() => import('./member/MemberCoupons').then(m => ({ default: m.MemberCoupons })));
const MemberRegalias = lazy(() => import('./member/MemberRegalias').then(m => ({ default: m.MemberRegalias })));
const MemberClubs = lazy(() => import('./member/MemberClubs').then(m => ({ default: m.MemberClubs })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  useDocumentTitle('Portal de Socio');
  const [tab, setTab] = useState('dashboard');
  const [member, setMember] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [commerces, setCommerces] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqForm, setReqForm] = useState({ destination: '', travel_date: '', guests: 1, message: '' });

  const loadMemberData = useCallback(() => {
    if (user?.member) setMember(user.member);
    else if (user?.member_id) {
      api.get('/auth/me').then(r => setMember(r.data.member)).catch(e => console.error('Failed to load member:', e));
    }
    api.get('/quotations').then(r => setQuotations(r.data)).catch(e => console.error('Failed to load quotations:', e));
    api.get('/announcements?target=members').then(r => setAnnouncements(r.data)).catch(e => console.error('Failed to load announcements:', e));
    api.get('/vacation-requests').then(r => setVacationRequests(r.data)).catch(e => console.error('Failed to load requests:', e));
    api.get('/packages?featured=true').then(r => setPackages(r.data.slice(0, 3))).catch(e => console.error('Failed to load packages:', e));
    api.get('/commerce').then(r => setCommerces(r.data.slice(0, 4))).catch(e => console.error('Failed to load commerce:', e));
    api.get('/referral/my-code').then(r => setReferralData(r.data)).catch(e => console.error('Failed to load referral:', e));
  }, [user]);

  useEffect(() => { loadMemberData(); }, [loadMemberData]);

  const submitRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vacation-requests', reqForm);
      toast.success('Solicitud enviada');
      setShowRequestForm(false);
      setReqForm({ destination: '', travel_date: '', guests: 1, message: '' });
      const r = await api.get('/vacation-requests');
      setVacationRequests(r.data);
    } catch { toast.error('Error al enviar solicitud'); }
  };

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Package },
    { id: 'coupons', label: 'Cupones', icon: QrCode },
    { id: 'regalias', label: 'Regalías', icon: Gift },
    { id: 'clubs', label: 'Clubs', icon: Building2 },
    { id: 'quotations', label: 'Cotizaciones', icon: FileText },
    { id: 'announcements', label: 'Anuncios', icon: Bell },
    { id: 'requests', label: 'Solicitudes', icon: MessageSquare },
    { id: 'referral', label: 'Referidos', icon: Share2 },
    { id: 'benefits', label: 'Beneficios', icon: Store },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary/20" data-testid="member-dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-1">
              Hola, {member?.name || user?.name || 'Socio'}
            </h1>
            <p className="text-muted-foreground text-sm">Bienvenido a tu portal de socio</p>
          </div>
          <Link
            to="/manual/member"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full text-xs font-bold uppercase tracking-[0.15em] bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors shrink-0"
            data-testid="member-manual-btn"
          >
            <BookOpen className="w-4 h-4" /> Manual
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3 mb-8" data-testid="member-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-300 ${
                tab === t.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white text-muted-foreground border border-border hover:border-primary/30 hover:text-primary hover:shadow-md'
              }`}
              data-testid={`member-tab-${t.id}`}
            >
              <t.icon className="w-5 h-5" />
              <span className="leading-tight">{t.label}</span>
            </button>
          ))}
        </div>

        <Suspense fallback={<TabLoader />}>
          {tab === 'dashboard' && <MemberOverview member={member} quotations={quotations} announcements={announcements} vacationRequests={vacationRequests} packages={packages} commerces={commerces} />}
          {tab === 'coupons' && <MemberCoupons />}
          {tab === 'quotations' && <MemberQuotations quotations={quotations} />}
          {tab === 'announcements' && <MemberAnnouncements announcements={announcements} />}
          {tab === 'requests' && <MemberRequests vacationRequests={vacationRequests} showRequestForm={showRequestForm} setShowRequestForm={setShowRequestForm} reqForm={reqForm} setReqForm={setReqForm} submitRequest={submitRequest} />}
          {tab === 'regalias' && <MemberRegalias />}
          {tab === 'clubs' && <MemberClubs />}
          {tab === 'referral' && <MemberReferrals referralData={referralData} />}
          {tab === 'benefits' && <MemberBenefits commerces={commerces} />}
        </Suspense>
      </div>

      <Link
        to="/chat"
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
        data-testid="chat-fab"
      >
        <MessageSquare className="w-6 h-6" />
      </Link>
    </div>
  );
}
