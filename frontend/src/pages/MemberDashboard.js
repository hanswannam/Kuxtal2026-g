import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { FileText, Bell, MessageSquare, Package, Store, Users, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MemberOverview = lazy(() => import('./member/MemberOverview').then(m => ({ default: m.MemberOverview })));
const MemberQuotations = lazy(() => import('./member/MemberQuotations').then(m => ({ default: m.MemberQuotations })));
const MemberAnnouncements = lazy(() => import('./member/MemberAnnouncements').then(m => ({ default: m.MemberAnnouncements })));
const MemberRequests = lazy(() => import('./member/MemberRequests').then(m => ({ default: m.MemberRequests })));
const MemberFamily = lazy(() => import('./member/MemberFamily').then(m => ({ default: m.MemberFamily })));
const MemberReferrals = lazy(() => import('./member/MemberReferrals').then(m => ({ default: m.MemberReferrals })));
const MemberBenefits = lazy(() => import('./member/MemberBenefits').then(m => ({ default: m.MemberBenefits })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [member, setMember] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [commerces, setCommerces] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: '', dpi: '', relationship: 'familiar' });
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
    const memberId = user?.member?._id || user?.member_id;
    if (memberId) {
      api.get(`/members/${memberId}/family`).then(r => setFamilyMembers(r.data)).catch(e => console.error('Failed to load family:', e));
    }
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

  const addFamilyMember = async (e) => {
    e.preventDefault();
    const memberId = member?._id || user?.member_id;
    try {
      await api.post(`/members/${memberId}/family`, familyForm);
      toast.success('Familiar agregado');
      setShowFamilyForm(false);
      setFamilyForm({ name: '', dpi: '', relationship: 'familiar' });
      const r = await api.get(`/members/${memberId}/family`);
      setFamilyMembers(r.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al agregar familiar');
    }
  };

  const removeFamilyMember = async (familyId) => {
    const memberId = member?._id || user?.member_id;
    await api.delete(`/members/${memberId}/family/${familyId}`);
    toast.success('Familiar eliminado');
    const r = await api.get(`/members/${memberId}/family`);
    setFamilyMembers(r.data);
  };

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Package },
    { id: 'quotations', label: 'Cotizaciones', icon: FileText },
    { id: 'announcements', label: 'Anuncios', icon: Bell },
    { id: 'requests', label: 'Solicitudes', icon: MessageSquare },
    { id: 'family', label: 'Familia', icon: Users },
    { id: 'referral', label: 'Referidos', icon: Share2 },
    { id: 'benefits', label: 'Beneficios', icon: Store },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary/20" data-testid="member-dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Hola, {member?.name || user?.name || 'Socio'}
          </h1>
          <p className="text-muted-foreground text-sm">Bienvenido a tu portal de socio</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-8" data-testid="member-tabs">
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
          {tab === 'quotations' && <MemberQuotations quotations={quotations} />}
          {tab === 'announcements' && <MemberAnnouncements announcements={announcements} />}
          {tab === 'requests' && <MemberRequests vacationRequests={vacationRequests} showRequestForm={showRequestForm} setShowRequestForm={setShowRequestForm} reqForm={reqForm} setReqForm={setReqForm} submitRequest={submitRequest} />}
          {tab === 'family' && <MemberFamily member={member} user={user} familyMembers={familyMembers} showFamilyForm={showFamilyForm} setShowFamilyForm={setShowFamilyForm} familyForm={familyForm} setFamilyForm={setFamilyForm} addFamilyMember={addFamilyMember} removeFamilyMember={removeFamilyMember} />}
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
