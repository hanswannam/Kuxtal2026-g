import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/badge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  LayoutDashboard, Users, Package, FileText, Bell, MessageSquare, Settings,
  Send, Store, TrendingUp, Gift, Loader2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const AdminOverview = lazy(() => import('./admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminMembers = lazy(() => import('./admin/AdminMembers').then(m => ({ default: m.AdminMembers })));
const AdminPackages = lazy(() => import('./admin/AdminPackages').then(m => ({ default: m.AdminPackages })));
const AdminQuotations = lazy(() => import('./admin/AdminQuotations').then(m => ({ default: m.AdminQuotations })));
const AdminReferrals = lazy(() => import('./admin/AdminReferrals').then(m => ({ default: m.AdminReferrals })));
const AdminAnnouncements = lazy(() => import('./admin/AdminAnnouncements').then(m => ({ default: m.AdminAnnouncements })));
const AdminRequests = lazy(() => import('./admin/AdminRequests').then(m => ({ default: m.AdminRequests })));
const AdminCommerces = lazy(() => import('./admin/AdminCommerces').then(m => ({ default: m.AdminCommerces })));
const AdminPush = lazy(() => import('./admin/AdminPush').then(m => ({ default: m.AdminPush })));
const AdminUsers = lazy(() => import('./admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminSettings = lazy(() => import('./admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminImport = lazy(() => import('./admin/AdminImport').then(m => ({ default: m.AdminImport })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const { user } = useAuth();
  useDocumentTitle('Panel Administrativo');
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [vacationReqs, setVacationReqs] = useState([]);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [commerces, setCommerces] = useState([]);
  const [showCommerceForm, setShowCommerceForm] = useState(false);
  const [commerceForm, setCommerceForm] = useState({ name: '', description: '', category: 'Servicios', location: '', phone: '', email: '', website: '', logo_url: '', benefit_description: '', validation_code: '', status: 'active' });
  const [commerceCategories, setCommerceCategories] = useState([]);
  const [pushForm, setPushForm] = useState({ title: '', message: '', link: '/' });
  const [pushHistory, setPushHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [referrals, setReferrals] = useState([]);

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [quotationResponse, setQuotationResponse] = useState({ id: '', response: '' });

  const [memberForm, setMemberForm] = useState({ contract_number: '', dpi: '', name: '', email: '', phone: '', service_years: 1, membership_start: '', membership_end: '', family_members_allowed: 1, investment_amount: 0, investment_plan: '', status: 'active' });
  const [packageForm, setPackageForm] = useState({ title: '', description: '', short_description: '', country: '', price: 0, member_price: 0, duration_days: 1, category: 'paquete', includes: [], rating: 4.8, image_url: '', gallery: [], featured: false, status: 'active' });
  const [includesInput, setIncludesInput] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', link: '', target: 'all', status: 'active' });

  const [adminUsers, setAdminUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [userView, setUserView] = useState('admins');

  const loadData = useCallback(async () => {
    try {
      const [s, m, p, q, a, v, w] = await Promise.all([
        api.get('/stats'), api.get('/members'), api.get('/packages'),
        api.get('/quotations'), api.get('/announcements'), api.get('/vacation-requests'),
        api.get('/config/whatsapp')
      ]);
      setStats(s.data); setMembers(m.data); setPackages(p.data);
      setQuotations(q.data); setAnnouncements(a.data); setVacationReqs(v.data);
      setWhatsappPhone(w.data.phone || '');
      api.get('/commerce').then(r => setCommerces(r.data)).catch(() => {});
      api.get('/commerce/categories').then(r => setCommerceCategories(r.data)).catch(() => {});
      api.get('/push/history').then(r => setPushHistory(r.data)).catch(() => {});
      api.get('/analytics').then(r => setAnalytics(r.data)).catch(() => {});
      api.get('/referrals').then(r => setReferrals(r.data)).catch(() => {});
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadUsers = async () => { try { const [a, all] = await Promise.all([api.get('/admin/users'), api.get('/admin/all-users')]); setAdminUsers(a.data); setAllUsers(all.data); } catch {} };

  const saveMember = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) { await api.put(`/members/${editingMember._id}`, memberForm); toast.success('Socio actualizado'); }
      else { await api.post('/members', memberForm); toast.success('Socio creado'); }
      setShowMemberForm(false); setEditingMember(null);
      setMemberForm({ contract_number: '', dpi: '', name: '', email: '', phone: '', service_years: 1, membership_start: '', membership_end: '', family_members_allowed: 1, status: 'active' });
      loadData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };
  const editMember = (m) => { setMemberForm(m); setEditingMember(m); setShowMemberForm(true); };
  const deleteMember = async (id, code) => { await api.delete(`/members/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };

  const savePackage = async (e) => {
    e.preventDefault();
    try {
      const data = { ...packageForm, price: Number(packageForm.price), member_price: Number(packageForm.member_price), duration_days: Number(packageForm.duration_days) };
      if (editingPackage) { await api.put(`/packages/${editingPackage._id}`, data); toast.success('Paquete actualizado'); }
      else { await api.post('/packages', data); toast.success('Paquete creado'); }
      setShowPackageForm(false); setEditingPackage(null);
      setPackageForm({ title: '', description: '', short_description: '', country: '', price: 0, member_price: 0, duration_days: 1, category: 'paquete', includes: [], rating: 4.8, image_url: '', gallery: [], featured: false, status: 'active' });
      loadData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };
  const editPkg = (p) => { setPackageForm(p); setEditingPackage(p); setShowPackageForm(true); };
  const deletePkg = async (id, code) => { await api.delete(`/packages/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };
  const addInclude = () => { if (includesInput.trim()) { setPackageForm({...packageForm, includes: [...packageForm.includes, includesInput.trim()]}); setIncludesInput(''); }};
  const removeInclude = (i) => { setPackageForm({...packageForm, includes: packageForm.includes.filter((_, idx) => idx !== i)}); };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    await api.post('/announcements', announcementForm);
    toast.success('Anuncio creado');
    setShowAnnouncementForm(false);
    setAnnouncementForm({ title: '', content: '', link: '', target: 'all', status: 'active' });
    loadData();
  };
  const deleteAnn = async (id, code) => { await api.delete(`/announcements/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };

  const respondQuotation = async () => {
    await api.put(`/quotations/${quotationResponse.id}/respond`, { response: quotationResponse.response, response_html: `<p>${quotationResponse.response}</p>` });
    toast.success('Respuesta enviada');
    setQuotationResponse({ id: '', response: '' });
    loadData();
  };

  const saveWhatsApp = async () => { await api.put('/config/whatsapp', { phone: whatsappPhone }); toast.success('WhatsApp actualizado'); };

  const saveCommerce = async (e) => {
    e.preventDefault();
    await api.post('/commerce', commerceForm);
    toast.success('Comercio creado');
    setShowCommerceForm(false);
    setCommerceForm({ name: '', description: '', category: 'Servicios', location: '', phone: '', email: '', website: '', logo_url: '', benefit_description: '', validation_code: '', status: 'active' });
    loadData();
  };
  const deleteCommerce = async (id, code) => { await api.delete(`/commerce/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };

  const sendPush = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/push/send', pushForm);
    toast.success(data.message);
    setPushForm({ title: '', message: '', link: '/' });
    api.get('/push/history').then(r => setPushHistory(r.data)).catch(() => {});
  };

  const handleImageUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      callback(`${API}/api/files/${data.path}`);
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir imagen'); }
    setUploading(false);
  };

  const updateReqStatus = async (id, status) => {
    await api.put(`/vacation-requests/${id}/status`, { status });
    toast.success('Estado actualizado');
    loadData();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import', label: 'Importar', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'members', label: 'Socios', icon: Users },
    { id: 'packages', label: 'Paquetes', icon: Package },
    { id: 'commerce', label: 'Comercios', icon: Store },
    { id: 'quotations', label: 'Cotizaciones', icon: FileText },
    { id: 'referrals', label: 'Referidos', icon: Gift },
    { id: 'announcements', label: 'Anuncios', icon: Bell },
    { id: 'push', label: 'Push', icon: Send },
    { id: 'requests', label: 'Solicitudes', icon: MessageSquare },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-20 bg-secondary/20" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Panel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gestion CRM de Kuxtal Travel</p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary border-0 px-3">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</Badge>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6" data-testid="admin-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if(t.id==='users') loadUsers(); }}
              className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] sm:text-xs font-semibold rounded-2xl transition-all duration-300 ${
                tab === t.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-white text-muted-foreground border border-border hover:border-primary/30 hover:text-primary hover:shadow-md'
              }`}
              data-testid={`admin-tab-${t.id}`}>
              <t.icon className="w-5 h-5" /> {t.label}
            </button>
          ))}
        </div>

        <Suspense fallback={<TabLoader />}>
          {tab === 'dashboard' && <AdminOverview stats={stats} setTab={setTab} setShowMemberForm={setShowMemberForm} setEditingMember={setEditingMember} setShowPackageForm={setShowPackageForm} setEditingPackage={setEditingPackage} />}
          {tab === 'import' && <AdminImport onPackageCreated={loadData} />}
          {tab === 'analytics' && <AdminAnalytics analytics={analytics} stats={stats} />}
          {tab === 'members' && <AdminMembers members={members} memberForm={memberForm} setMemberForm={setMemberForm} showMemberForm={showMemberForm} setShowMemberForm={setShowMemberForm} editingMember={editingMember} setEditingMember={setEditingMember} saveMember={saveMember} editMember={editMember} deleteMember={deleteMember} />}
          {tab === 'packages' && <AdminPackages packages={packages} packageForm={packageForm} setPackageForm={setPackageForm} showPackageForm={showPackageForm} setShowPackageForm={setShowPackageForm} editingPackage={editingPackage} setEditingPackage={setEditingPackage} savePackage={savePackage} editPkg={editPkg} deletePkg={deletePkg} includesInput={includesInput} setIncludesInput={setIncludesInput} addInclude={addInclude} removeInclude={removeInclude} handleImageUpload={handleImageUpload} uploading={uploading} />}
          {tab === 'quotations' && <AdminQuotations quotations={quotations} quotationResponse={quotationResponse} setQuotationResponse={setQuotationResponse} respondQuotation={respondQuotation} />}
          {tab === 'referrals' && <AdminReferrals referrals={referrals} loadData={loadData} />}
          {tab === 'announcements' && <AdminAnnouncements announcements={announcements} announcementForm={announcementForm} setAnnouncementForm={setAnnouncementForm} showAnnouncementForm={showAnnouncementForm} setShowAnnouncementForm={setShowAnnouncementForm} saveAnnouncement={saveAnnouncement} deleteAnn={deleteAnn} />}
          {tab === 'requests' && <AdminRequests vacationReqs={vacationReqs} updateReqStatus={updateReqStatus} />}
          {tab === 'commerce' && <AdminCommerces commerces={commerces} commerceForm={commerceForm} setCommerceForm={setCommerceForm} showCommerceForm={showCommerceForm} setShowCommerceForm={setShowCommerceForm} commerceCategories={commerceCategories} saveCommerce={saveCommerce} deleteCommerce={deleteCommerce} handleImageUpload={handleImageUpload} uploading={uploading} />}
          {tab === 'push' && <AdminPush pushForm={pushForm} setPushForm={setPushForm} sendPush={sendPush} pushHistory={pushHistory} />}
          {tab === 'users' && <AdminUsers adminUsers={adminUsers} allUsers={allUsers} showUserForm={showUserForm} setShowUserForm={setShowUserForm} userForm={userForm} setUserForm={setUserForm} userView={userView} setUserView={setUserView} loadUsers={loadUsers} />}
          {tab === 'settings' && <AdminSettings whatsappPhone={whatsappPhone} setWhatsappPhone={setWhatsappPhone} saveWhatsApp={saveWhatsApp} stats={stats} />}
        </Suspense>
      </div>
    </div>
  );
}
