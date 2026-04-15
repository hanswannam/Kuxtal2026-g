import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  LayoutDashboard, Users, Package, FileText, Bell, MessageSquare, Settings,
  Plus, Trash2, Edit, Eye, Search, X, Send, Phone, CheckCircle2, Clock, BarChart3,
  Store, Upload, Image, TrendingUp, Gift, PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithCode } from '../components/DeleteWithCode';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartPie, Pie, Cell } from 'recharts';
import api from '../lib/api';

const API = process.env.REACT_APP_BACKEND_URL;
const ax = api;

export default function AdminDashboard() {
  const { user } = useAuth();
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

  // Modals
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

  const loadData = useCallback(async () => {
    try {
      const [s, m, p, q, a, v, w] = await Promise.all([
        ax.get('/stats'), ax.get('/members'), ax.get('/packages'),
        ax.get('/quotations'), ax.get('/announcements'), ax.get('/vacation-requests'),
        ax.get('/config/whatsapp')
      ]);
      setStats(s.data); setMembers(m.data); setPackages(p.data);
      setQuotations(q.data); setAnnouncements(a.data); setVacationReqs(v.data);
      setWhatsappPhone(w.data.phone || '');
      // Load commerce data
      ax.get('/commerce').then(r => setCommerces(r.data)).catch(() => {});
      ax.get('/commerce/categories').then(r => setCommerceCategories(r.data)).catch(() => {});
      ax.get('/push/history').then(r => setPushHistory(r.data)).catch(() => {});
      ax.get('/analytics').then(r => setAnalytics(r.data)).catch(() => {});
      ax.get('/referrals').then(r => setReferrals(r.data)).catch(() => {});
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Member CRUD
  const saveMember = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await ax.put(`/members/${editingMember._id}`, memberForm);
        toast.success('Socio actualizado');
      } else {
        await ax.post('/members', memberForm);
        toast.success('Socio creado');
      }
      setShowMemberForm(false); setEditingMember(null);
      setMemberForm({ contract_number: '', dpi: '', name: '', email: '', phone: '', service_years: 1, membership_start: '', membership_end: '', family_members_allowed: 1, status: 'active' });
      loadData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };
  const editMember = (m) => { setMemberForm(m); setEditingMember(m); setShowMemberForm(true); };
  const deleteMember = async (id, code) => { await ax.delete(`/members/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };

  // Package CRUD
  const savePackage = async (e) => {
    e.preventDefault();
    try {
      const data = { ...packageForm, price: Number(packageForm.price), member_price: Number(packageForm.member_price), duration_days: Number(packageForm.duration_days) };
      if (editingPackage) {
        await ax.put(`/packages/${editingPackage._id}`, data);
        toast.success('Paquete actualizado');
      } else {
        await ax.post('/packages', data);
        toast.success('Paquete creado');
      }
      setShowPackageForm(false); setEditingPackage(null);
      setPackageForm({ title: '', description: '', short_description: '', country: '', price: 0, member_price: 0, duration_days: 1, category: 'paquete', includes: [], rating: 4.8, image_url: '', gallery: [], featured: false, status: 'active' });
      loadData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };
  const editPkg = (p) => { setPackageForm(p); setEditingPackage(p); setShowPackageForm(true); };
  const deletePkg = async (id, code) => { await ax.delete(`/packages/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };
  const addInclude = () => { if (includesInput.trim()) { setPackageForm({...packageForm, includes: [...packageForm.includes, includesInput.trim()]}); setIncludesInput(''); }};
  const removeInclude = (i) => { setPackageForm({...packageForm, includes: packageForm.includes.filter((_, idx) => idx !== i)}); };

  // Announcements
  const saveAnnouncement = async (e) => {
    e.preventDefault();
    await ax.post('/announcements', announcementForm);
    toast.success('Anuncio creado');
    setShowAnnouncementForm(false);
    setAnnouncementForm({ title: '', content: '', link: '', target: 'all', status: 'active' });
    loadData();
  };
  const deleteAnn = async (id, code) => { await ax.delete(`/announcements/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };

  // Quotation response
  const respondQuotation = async () => {
    await ax.put(`/quotations/${quotationResponse.id}/respond`, { response: quotationResponse.response, response_html: `<p>${quotationResponse.response}</p>` });
    toast.success('Respuesta enviada');
    setQuotationResponse({ id: '', response: '' });
    loadData();
  };

  // WhatsApp
  const saveWhatsApp = async () => {
    await ax.put('/config/whatsapp', { phone: whatsappPhone });
    toast.success('WhatsApp actualizado');
  };

  // Commerce CRUD
  const saveCommerce = async (e) => {
    e.preventDefault();
    await ax.post('/commerce', commerceForm);
    toast.success('Comercio creado');
    setShowCommerceForm(false);
    setCommerceForm({ name: '', description: '', category: 'Servicios', location: '', phone: '', email: '', website: '', logo_url: '', benefit_description: '', validation_code: '', status: 'active' });
    loadData();
  };
  const deleteCommerce = async (id, code) => { await ax.delete(`/commerce/${id}?delete_code=${encodeURIComponent(code)}`); loadData(); toast.success('Eliminado'); };

  // Push Notifications
  const sendPush = async (e) => {
    e.preventDefault();
    const { data } = await ax.post('/push/send', pushForm);
    toast.success(data.message);
    setPushForm({ title: '', message: '', link: '/' });
    ax.get('/push/history').then(r => setPushHistory(r.data)).catch(() => {});
  };

  // Image Upload
  const handleImageUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await ax.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const imageUrl = `${API}/api/files/${data.path}`;
      callback(imageUrl);
      toast.success('Imagen subida');
    } catch (err) {
      toast.error('Error al subir imagen');
    }
    setUploading(false);
  };

  // Vacation request status
  const updateReqStatus = async (id, status) => {
    await ax.put(`/vacation-requests/${id}/status`, { status });
    toast.success('Estado actualizado');
    loadData();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
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

  // Admin user management
  const [adminUsers, setAdminUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [userView, setUserView] = useState('admins');
  const loadUsers = async () => { try { const [a, all] = await Promise.all([ax.get('/admin/users'), ax.get('/admin/all-users')]); setAdminUsers(a.data); setAllUsers(all.data); } catch {} };

  return (
    <div className="min-h-screen pt-20 bg-secondary/20" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Panel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gestión CRM de Kuxtal Travel</p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary border-0 px-3">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</Badge>
        </div>

        {/* Tabs - attractive grid for mobile */}
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

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Socios Activos', value: stats.active_members || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Paquetes', value: stats.total_packages || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Cotizaciones', value: stats.pending_quotations || 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Comercios', value: stats.total_commerce || 0, icon: Store, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Referidos', value: stats.total_referrals || 0, icon: Gift, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Chats', value: stats.unread_chats || 0, icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { label: 'Solicitudes', value: stats.pending_requests || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Anuncios', value: stats.total_announcements || 0, icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-border hover:shadow-md transition-all cursor-pointer" onClick={() => setTab(s.label === 'Socios Activos' ? 'members' : s.label === 'Paquetes' ? 'packages' : s.label === 'Cotizaciones' ? 'quotations' : s.label === 'Comercios' ? 'commerce' : s.label === 'Referidos' ? 'referrals' : s.label === 'Chats' ? 'settings' : s.label === 'Solicitudes' ? 'requests' : 'announcements')} data-testid={`stat-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}><s.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Nuevo Socio', icon: Users, action: () => { setTab('members'); setTimeout(() => { setShowMemberForm(true); setEditingMember(null); }, 100); }, color: 'from-emerald-500 to-emerald-600' },
                { label: 'Nuevo Paquete', icon: Package, action: () => { setTab('packages'); setTimeout(() => { setShowPackageForm(true); setEditingPackage(null); }, 100); }, color: 'from-blue-500 to-blue-600' },
                { label: 'Nuevo Comercio', icon: Store, action: () => window.location.href = '/admin/new-commerce', color: 'from-violet-500 to-violet-600' },
                { label: 'Ver Mensajes', icon: MessageSquare, action: () => window.location.href = '/chat', color: 'from-cyan-500 to-cyan-600' },
              ].map((a, i) => (
                <button key={i} onClick={a.action}
                  className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${a.color} text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all`}
                  data-testid={`quick-action-${i}`}>
                  <a.icon className="w-5 h-5" /> {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && analytics && (
          <div className="space-y-6 animate-fade-in" data-testid="admin-analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member Growth Chart */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-heading text-lg font-semibold mb-4">Crecimiento de Socios</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics.member_growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE4E4" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="members" stroke="#C1121F" fill="#C1121F" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Quotation Trends */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-heading text-lg font-semibold mb-4">Tendencia de Cotizaciones</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.quotation_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE4E4" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#C1121F" radius={[4,4,0,0]} name="Total" />
                    <Bar dataKey="responded" fill="#10B981" radius={[4,4,0,0]} name="Respondidas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Packages */}
              {analytics.top_packages?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-border">
                  <h3 className="font-heading text-lg font-semibold mb-4">Top Paquetes por Cotizaciones</h3>
                  <div className="space-y-3">
                    {analytics.top_packages.map((p, i) => (
                      <div key={i} className="flex items-center justify-between" data-testid={`top-pkg-${i}`}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                        </div>
                        <Badge variant="secondary" className="rounded-full">{p.quotations} cotizaciones</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Distribution */}
              {analytics.country_distribution?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-border">
                  <h3 className="font-heading text-lg font-semibold mb-4">Distribución por País</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartPie>
                      <Pie data={analytics.country_distribution} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={80} label={({ country, count }) => `${country} (${count})`}>
                        {analytics.country_distribution.map((_, i) => (
                          <Cell key={i} fill={['#C1121F','#1E40AF','#059669','#D97706','#7C3AED','#DB2777'][i % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Referidos Totales</p>
                <p className="text-2xl font-bold">{analytics.referrals?.total || 0}</p>
                <p className="text-xs text-emerald-600 mt-1">{analytics.referrals?.converted || 0} convertidos</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Visitas en Comercios</p>
                <p className="text-2xl font-bold">{analytics.commerce_visits || 0}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Comercios Activos</p>
                <p className="text-2xl font-bold">{stats.total_commerce || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* REFERRALS */}
        {tab === 'referrals' && (
          <div className="animate-fade-in" data-testid="admin-referrals">
            <h2 className="font-heading text-lg font-semibold mb-4">Referidos ({referrals.length})</h2>
            {referrals.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin referidos</h3>
                <p className="text-sm text-muted-foreground">Los referidos de los socios aparecerán aquí</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Nombre</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Email</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Referido por</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-right p-3 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r, i) => (
                      <tr key={r._id} className="border-t border-border" data-testid={`referral-row-${i}`}>
                        <td className="p-3 font-medium">{r.name}</td>
                        <td className="p-3 hidden sm:table-cell text-muted-foreground">{r.email}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{r.referrer_name}</td>
                        <td className="p-3">
                          <Badge variant={r.status === 'converted' ? 'default' : r.status === 'contacted' ? 'secondary' : 'outline'} className="rounded-full text-xs">
                            {r.status === 'pending' ? 'Pendiente' : r.status === 'contacted' ? 'Contactado' : r.status === 'converted' ? 'Convertido' : r.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={r.status}
                            onChange={async (e) => { await ax.put(`/referrals/${r._id}/status`, { status: e.target.value }); loadData(); toast.success('Estado actualizado'); }}
                            className="text-xs rounded-lg border border-input px-2 py-1"
                            data-testid={`referral-status-${i}`}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="contacted">Contactado</option>
                            <option value="converted">Convertido</option>
                            <option value="rejected">Rechazado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS */}
        {tab === 'members' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-semibold">Socios ({members.length})</h2>
              <Button onClick={() => { setShowMemberForm(true); setEditingMember(null); setMemberForm({ contract_number: '', dpi: '', name: '', email: '', phone: '', service_years: 1, membership_start: '', membership_end: '', family_members_allowed: 1, status: 'active' }); }} className="rounded-full" data-testid="add-member-btn">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Socio
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="members-table">
                  <thead className="bg-secondary/50">
                    <tr><th className="text-left p-3 font-medium">Contrato</th><th className="text-left p-3 font-medium">Nombre</th><th className="text-left p-3 font-medium hidden sm:table-cell">Años</th><th className="text-left p-3 font-medium hidden md:table-cell">Estado</th><th className="text-right p-3 font-medium">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr key={m._id} className="border-t border-border hover:bg-secondary/30 transition-colors" data-testid={`member-row-${i}`}>
                        <td className="p-3 font-medium">{m.contract_number}</td>
                        <td className="p-3">{m.name}</td>
                        <td className="p-3 hidden sm:table-cell">{m.service_years}</td>
                        <td className="p-3 hidden md:table-cell"><Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="rounded-full text-xs">{m.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => editMember(m)} data-testid={`edit-member-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                            <DeleteWithCode onConfirm={(code) => deleteMember(m._id, code)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Member Form Modal */}
            {showMemberForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="member-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-heading text-xl font-semibold mb-4">{editingMember ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                  <form onSubmit={saveMember} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Contrato</Label><Input value={memberForm.contract_number} onChange={e => setMemberForm({...memberForm, contract_number: e.target.value})} required className="rounded-xl mt-1" data-testid="mf-contract" /></div>
                      <div><Label className="text-xs">DPI</Label><Input value={memberForm.dpi} onChange={e => setMemberForm({...memberForm, dpi: e.target.value})} required className="rounded-xl mt-1" data-testid="mf-dpi" /></div>
                    </div>
                    <div><Label className="text-xs">Nombre</Label><Input value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="mf-name" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Email</Label><Input value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} className="rounded-xl mt-1" data-testid="mf-email" /></div>
                      <div><Label className="text-xs">Teléfono</Label><Input value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} className="rounded-xl mt-1" data-testid="mf-phone" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Años Servicio</Label><Input type="number" value={memberForm.service_years} onChange={e => setMemberForm({...memberForm, service_years: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="mf-years" /></div>
                      <div><Label className="text-xs">Inicio</Label><Input type="date" value={memberForm.membership_start} onChange={e => setMemberForm({...memberForm, membership_start: e.target.value})} className="rounded-xl mt-1" data-testid="mf-start" /></div>
                      <div><Label className="text-xs">Fin</Label><Input type="date" value={memberForm.membership_end} onChange={e => setMemberForm({...memberForm, membership_end: e.target.value})} className="rounded-xl mt-1" data-testid="mf-end" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Familiares</Label><Input type="number" value={memberForm.family_members_allowed} onChange={e => setMemberForm({...memberForm, family_members_allowed: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="mf-family" /></div>
                      <div>
                        <Label className="text-xs">Estado</Label>
                        <select value={memberForm.status} onChange={e => setMemberForm({...memberForm, status: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="mf-status">
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Inversión (Q.)</Label><Input type="number" value={memberForm.investment_amount} onChange={e => setMemberForm({...memberForm, investment_amount: parseFloat(e.target.value) || 0})} className="rounded-xl mt-1" data-testid="mf-investment" /></div>
                      <div><Label className="text-xs">Plan de Inversión</Label><Input value={memberForm.investment_plan} onChange={e => setMemberForm({...memberForm, investment_plan: e.target.value})} placeholder="Ej: Plan Premium 5 años" className="rounded-xl mt-1" data-testid="mf-plan" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => { setShowMemberForm(false); setEditingMember(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="mf-submit">Guardar</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PACKAGES */}
        {tab === 'packages' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-semibold">Paquetes ({packages.length})</h2>
              <Button onClick={() => { setShowPackageForm(true); setEditingPackage(null); setPackageForm({ title: '', description: '', short_description: '', country: '', price: 0, member_price: 0, duration_days: 1, category: 'paquete', includes: [], rating: 4.8, image_url: '', gallery: [], featured: false, status: 'active' }); }} className="rounded-full" data-testid="add-package-btn">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Paquete
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((p, i) => (
                <div key={p._id} className="bg-white rounded-2xl border border-border overflow-hidden" data-testid={`pkg-card-${i}`}>
                  <div className="aspect-video bg-muted overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-8 h-8" /></div>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="rounded-full text-xs">{p.category}</Badge>
                      {p.featured && <Badge className="rounded-full text-xs bg-primary">Destacado</Badge>}
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{p.country} &middot; {p.duration_days} días</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">Q.{p.price?.toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => editPkg(p)} data-testid={`edit-pkg-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                        <DeleteWithCode onConfirm={(code) => deletePkg(p._id, code)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showPackageForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="package-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-heading text-xl font-semibold mb-4">{editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}</h3>
                  <form onSubmit={savePackage} className="space-y-3">
                    <div><Label className="text-xs">Título</Label><Input value={packageForm.title} onChange={e => setPackageForm({...packageForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-title" /></div>
                    <div><Label className="text-xs">Descripción corta</Label><Input value={packageForm.short_description} onChange={e => setPackageForm({...packageForm, short_description: e.target.value})} className="rounded-xl mt-1" data-testid="pf-short-desc" /></div>
                    <div><Label className="text-xs">Descripción</Label><Textarea value={packageForm.description} onChange={e => setPackageForm({...packageForm, description: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-description" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">País</Label><Input value={packageForm.country} onChange={e => setPackageForm({...packageForm, country: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-country" /></div>
                      <div>
                        <Label className="text-xs">Categoría</Label>
                        <select value={packageForm.category} onChange={e => setPackageForm({...packageForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="pf-category">
                          <option value="paquete">Paquete</option>
                          <option value="alojamiento">Alojamiento</option>
                          <option value="experiencia">Experiencia</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Precio (Q.)</Label><Input type="number" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: e.target.value})} required className="rounded-xl mt-1" data-testid="pf-price" /></div>
                      <div><Label className="text-xs">Precio Socio</Label><Input type="number" value={packageForm.member_price} onChange={e => setPackageForm({...packageForm, member_price: e.target.value})} className="rounded-xl mt-1" data-testid="pf-member-price" /></div>
                      <div><Label className="text-xs">Días</Label><Input type="number" value={packageForm.duration_days} onChange={e => setPackageForm({...packageForm, duration_days: e.target.value})} className="rounded-xl mt-1" data-testid="pf-days" /></div>
                    </div>
                    <div>
                      <Label className="text-xs">URL Imagen</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={packageForm.image_url} onChange={e => setPackageForm({...packageForm, image_url: e.target.value})} className="rounded-xl" data-testid="pf-image" placeholder="URL o sube imagen" />
                        <label className="shrink-0">
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setPackageForm({...packageForm, image_url: url}))} />
                          <Button type="button" variant="outline" size="sm" className="rounded-xl h-10" disabled={uploading} asChild>
                            <span><Upload className="w-4 h-4" /></span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    {/* Includes */}
                    <div>
                      <Label className="text-xs">Incluye</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={includesInput} onChange={e => setIncludesInput(e.target.value)} placeholder="Ej: Boletos Aéreos" className="rounded-xl" onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addInclude();}}} data-testid="pf-include-input" />
                        <Button type="button" onClick={addInclude} size="sm" className="rounded-xl" data-testid="pf-add-include">+</Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {packageForm.includes.map((inc, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs">
                            {inc}<button type="button" onClick={() => removeInclude(idx)}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={packageForm.featured} onChange={e => setPackageForm({...packageForm, featured: e.target.checked})} id="featured" data-testid="pf-featured" />
                      <Label htmlFor="featured" className="text-xs">Destacado</Label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => { setShowPackageForm(false); setEditingPackage(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="pf-submit">Guardar</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUOTATIONS */}
        {tab === 'quotations' && (
          <div className="space-y-4 animate-fade-in" data-testid="admin-quotations">
            <h2 className="font-heading text-lg font-semibold">Cotizaciones ({quotations.length})</h2>
            {quotations.map((q, i) => (
              <div key={q._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`admin-quotation-${i}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{q.name || `Socio: ${q.contract_number}`}</h3>
                    <p className="text-xs text-muted-foreground">{q.email} &middot; {q.phone}</p>
                  </div>
                  <Badge variant={q.status === 'responded' ? 'default' : 'secondary'} className="rounded-full">
                    {q.status === 'pending' ? 'Pendiente' : 'Respondida'}
                  </Badge>
                </div>
                {q.message && <p className="text-sm text-muted-foreground mb-3">{q.message}</p>}
                <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString('es')}</p>
                {q.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {quotationResponse.id === q._id ? (
                      <div className="space-y-2">
                        <Textarea value={quotationResponse.response} onChange={e => setQuotationResponse({...quotationResponse, response: e.target.value})} placeholder="Escribir respuesta..." className="rounded-xl" data-testid={`quotation-response-${i}`} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={respondQuotation} className="rounded-full bg-primary" data-testid={`send-response-${i}`}><Send className="w-3 h-3 mr-1" /> Enviar</Button>
                          <Button size="sm" variant="outline" onClick={() => setQuotationResponse({ id: '', response: '' })} className="rounded-full">Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setQuotationResponse({ id: q._id, response: '' })} className="rounded-full" data-testid={`respond-quotation-${i}`}>Responder</Button>
                    )}
                  </div>
                )}
                {q.status === 'responded' && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={async () => {
                      try {
                        const { data } = await ax.get(`/quotations/${q._id}/share`);
                        if (data.whatsapp_url) window.open(data.whatsapp_url, '_blank');
                        else toast.error('Configura WhatsApp en ajustes primero');
                      } catch { toast.error('Error al compartir'); }
                    }} data-testid={`share-wa-${i}`}>
                      <Phone className="w-3 h-3 mr-1" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={async () => {
                      try {
                        const { data } = await ax.get(`/quotations/${q._id}/share`);
                        window.open(data.mailto_url, '_blank');
                      } catch { toast.error('Error al compartir'); }
                    }} data-testid={`share-email-${i}`}>
                      <Send className="w-3 h-3 mr-1" /> Email
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === 'announcements' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-semibold">Anuncios ({announcements.length})</h2>
              <Button onClick={() => setShowAnnouncementForm(true)} className="rounded-full" data-testid="add-announcement-btn">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Anuncio
              </Button>
            </div>
            <div className="space-y-3">
              {announcements.map((a, i) => (
                <div key={a._id} className="bg-white rounded-2xl p-5 border border-border flex justify-between items-start" data-testid={`admin-announcement-${i}`}>
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="rounded-full text-xs">{a.target}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('es')}</span>
                    </div>
                  </div>
                  <DeleteWithCode onConfirm={(code) => deleteAnn(a._id, code)} />
                </div>
              ))}
            </div>

            {showAnnouncementForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="announcement-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Nuevo Anuncio</h3>
                  <form onSubmit={saveAnnouncement} className="space-y-3">
                    <div><Label className="text-xs">Título</Label><Input value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} required className="rounded-xl mt-1" data-testid="af-title" /></div>
                    <div><Label className="text-xs">Contenido</Label><Textarea value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} required className="rounded-xl mt-1" data-testid="af-content" /></div>
                    <div><Label className="text-xs">Enlace (opcional)</Label><Input value={announcementForm.link} onChange={e => setAnnouncementForm({...announcementForm, link: e.target.value})} className="rounded-xl mt-1" data-testid="af-link" /></div>
                    <div>
                      <Label className="text-xs">Dirigido a</Label>
                      <select value={announcementForm.target} onChange={e => setAnnouncementForm({...announcementForm, target: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="af-target">
                        <option value="all">Todos</option>
                        <option value="members">Socios</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowAnnouncementForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="af-submit">Crear</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VACATION REQUESTS */}
        {tab === 'requests' && (
          <div className="space-y-4 animate-fade-in" data-testid="admin-requests">
            <h2 className="font-heading text-lg font-semibold">Solicitudes de Vacaciones ({vacationReqs.length})</h2>
            {vacationReqs.map((r, i) => (
              <div key={r._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`admin-request-${i}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{r.destination}</h3>
                    <p className="text-xs text-muted-foreground">{r.user_name} &middot; {r.travel_date} &middot; {r.guests} huéspedes</p>
                  </div>
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="rounded-full">
                    {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </Badge>
                </div>
                {r.messages?.map((m, j) => (
                  <div key={j} className="text-sm mt-1"><span className="font-medium text-xs">{m.from}:</span><span className="text-muted-foreground ml-1">{m.text}</span></div>
                ))}
                {r.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button size="sm" onClick={() => updateReqStatus(r._id, 'approved')} className="rounded-full bg-emerald-600 hover:bg-emerald-700" data-testid={`approve-req-${i}`}><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar</Button>
                    <Button size="sm" variant="outline" onClick={() => updateReqStatus(r._id, 'rejected')} className="rounded-full text-destructive" data-testid={`reject-req-${i}`}><X className="w-3 h-3 mr-1" /> Rechazar</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* COMMERCE */}
        {tab === 'commerce' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-lg font-semibold">Comercios ({commerces.length})</h2>
              <Button onClick={() => window.location.href = '/admin/new-commerce'} className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" data-testid="add-commerce-btn">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Comercio
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {commerces.map((c, i) => (
                <div key={c._id} className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-all" data-testid={`admin-commerce-${i}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      <Badge variant="secondary" className="rounded-full text-xs mt-1">{c.category}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setCommerceForm({...c}); setShowCommerceForm(true); }} className="text-primary" data-testid={`edit-commerce-${i}`}><Edit className="w-3.5 h-3.5" /></Button>
                      <DeleteWithCode onConfirm={(code) => deleteCommerce(c._id, code)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{c.description}</p>
                  <p className="text-xs text-muted-foreground">{c.location}</p>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">{c.validation_code}</span>
                    <span className="text-[10px] text-muted-foreground select-all">ID: {c._id}</span>
                  </div>
                </div>
              ))}
            </div>

            {showCommerceForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="commerce-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-heading text-xl font-semibold mb-4">Nuevo Comercio</h3>
                  <form onSubmit={saveCommerce} className="space-y-3">
                    <div><Label className="text-xs">Nombre</Label><Input value={commerceForm.name} onChange={e => setCommerceForm({...commerceForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="cf-name" /></div>
                    <div><Label className="text-xs">Descripción</Label><Textarea value={commerceForm.description} onChange={e => setCommerceForm({...commerceForm, description: e.target.value})} className="rounded-xl mt-1" data-testid="cf-desc" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Categoría</Label>
                        <select value={commerceForm.category} onChange={e => setCommerceForm({...commerceForm, category: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="cf-category">
                          {commerceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div><Label className="text-xs">Ubicación</Label><Input value={commerceForm.location} onChange={e => setCommerceForm({...commerceForm, location: e.target.value})} className="rounded-xl mt-1" data-testid="cf-location" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Teléfono</Label><Input value={commerceForm.phone} onChange={e => setCommerceForm({...commerceForm, phone: e.target.value})} className="rounded-xl mt-1" data-testid="cf-phone" /></div>
                      <div><Label className="text-xs">Email</Label><Input value={commerceForm.email} onChange={e => setCommerceForm({...commerceForm, email: e.target.value})} className="rounded-xl mt-1" data-testid="cf-email" /></div>
                    </div>
                    <div><Label className="text-xs">Beneficio para Socios</Label><Textarea value={commerceForm.benefit_description} onChange={e => setCommerceForm({...commerceForm, benefit_description: e.target.value})} placeholder="Ej: 20% de descuento en consumo" className="rounded-xl mt-1" data-testid="cf-benefit" /></div>
                    <div>
                      <Label className="text-xs">Logo (URL o subir imagen)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={commerceForm.logo_url || ''} onChange={e => setCommerceForm({...commerceForm, logo_url: e.target.value})} placeholder="https://... o sube imagen" className="rounded-xl" data-testid="cf-logo" />
                        <label className="shrink-0">
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, url => setCommerceForm({...commerceForm, logo_url: url}))} />
                          <Button type="button" variant="outline" size="sm" className="rounded-xl h-10" disabled={uploading} asChild><span><Upload className="w-4 h-4" /></span></Button>
                        </label>
                      </div>
                      {commerceForm.logo_url && <img src={commerceForm.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover mt-2 border" />}
                    </div>
                    <div><Label className="text-xs">Sitio Web</Label><Input value={commerceForm.website || ''} onChange={e => setCommerceForm({...commerceForm, website: e.target.value})} placeholder="https://www.micomercio.com" className="rounded-xl mt-1" data-testid="cf-website" /></div>
                    <div><Label className="text-xs">Código de Validación (se genera automáticamente si se deja vacío)</Label><Input value={commerceForm.validation_code} onChange={e => setCommerceForm({...commerceForm, validation_code: e.target.value.toUpperCase()})} placeholder="Ej: MICOMERCIO01" className="rounded-xl mt-1 font-mono" data-testid="cf-code" /></div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowCommerceForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="cf-submit">Crear</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PUSH NOTIFICATIONS */}
        {tab === 'push' && (
          <div className="space-y-6 animate-fade-in" data-testid="admin-push">
            <div className="max-w-md">
              <h2 className="font-heading text-lg font-semibold mb-4">Enviar Notificación Push</h2>
              <form onSubmit={sendPush} className="bg-white rounded-2xl p-6 border border-border space-y-3">
                <div><Label className="text-xs">Título</Label><Input value={pushForm.title} onChange={e => setPushForm({...pushForm, title: e.target.value})} required placeholder="Kuxtal Travel" className="rounded-xl mt-1" data-testid="push-title" /></div>
                <div><Label className="text-xs">Mensaje</Label><Textarea value={pushForm.message} onChange={e => setPushForm({...pushForm, message: e.target.value})} required placeholder="Tu mensaje aquí..." className="rounded-xl mt-1" data-testid="push-message" /></div>
                <div><Label className="text-xs">Enlace</Label><Input value={pushForm.link} onChange={e => setPushForm({...pushForm, link: e.target.value})} placeholder="/" className="rounded-xl mt-1" data-testid="push-link" /></div>
                <div><Label className="text-xs">Imagen (URL opcional)</Label><Input value={pushForm.image_url || ''} onChange={e => setPushForm({...pushForm, image_url: e.target.value})} placeholder="https://..." className="rounded-xl mt-1" data-testid="push-image" /></div>
                <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90" data-testid="push-send-btn"><Send className="w-4 h-4 mr-2" /> Enviar Notificación</Button>
              </form>
            </div>
            {pushHistory.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold mb-3">Historial</h3>
                <div className="space-y-2">
                  {pushHistory.map((n, i) => (
                    <div key={n._id} className="bg-white rounded-xl p-4 border border-border" data-testid={`push-history-${i}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                        </div>
                        <Badge variant="secondary" className="rounded-full text-xs">{n.recipients_count} destinatarios</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.sent_at).toLocaleString('es')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS MANAGEMENT */}
        {tab === 'users' && (
          <div className="animate-fade-in" data-testid="admin-users">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="font-heading text-lg font-semibold">Control de Usuarios</h2>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant={userView === 'admins' ? 'default' : 'outline'} className="rounded-full text-xs" onClick={() => setUserView('admins')}>Administradores ({adminUsers.length})</Button>
                  <Button size="sm" variant={userView === 'all' ? 'default' : 'outline'} className="rounded-full text-xs" onClick={() => setUserView('all')}>Todos ({allUsers.length})</Button>
                </div>
              </div>
              <Button onClick={() => setShowUserForm(true)} className="rounded-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" data-testid="add-user-btn">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Admin
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr><th className="text-left p-3 font-medium">Nombre</th><th className="text-left p-3 font-medium">Email</th><th className="text-left p-3 font-medium">Rol</th><th className="text-center p-3 font-medium">Estado</th><th className="text-right p-3 font-medium">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {(userView === 'admins' ? adminUsers : allUsers).map((u, i) => (
                      <tr key={u._id} className="border-t border-border hover:bg-secondary/30 transition-colors" data-testid={`user-row-${i}`}>
                        <td className="p-3 font-medium">{u.name}</td>
                        <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                        <td className="p-3"><Badge variant={u.role === 'super_admin' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'} className="rounded-full text-xs">{u.role}</Badge></td>
                        <td className="p-3 text-center">
                          <button
                            onClick={async () => {
                              try { await ax.put(`/admin/users/${u._id}/toggle-active`); loadUsers(); toast.success('Estado actualizado'); }
                              catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              u.is_active !== false ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                            data-testid={`toggle-user-${i}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {u.is_active !== false ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <DeleteWithCode onConfirm={async (code) => {
                            try { await ax.delete(`/admin/users/${u._id}?delete_code=${encodeURIComponent(code)}`); loadUsers(); toast.success('Eliminado'); }
                            catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
                          }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {showUserForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="user-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Nuevo Administrador</h3>
                  <form onSubmit={async (e) => { e.preventDefault(); try { await ax.post('/admin/users', userForm); toast.success('Usuario creado'); setShowUserForm(false); setUserForm({ name: '', email: '', password: '', role: 'admin' }); loadUsers(); } catch (err) { toast.error(err.response?.data?.detail || 'Error'); } }} className="space-y-3">
                    <div><Label className="text-xs">Nombre</Label><Input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="uf-name" /></div>
                    <div><Label className="text-xs">Email</Label><Input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required className="rounded-xl mt-1" data-testid="uf-email" /></div>
                    <div><Label className="text-xs">Contraseña</Label><Input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required className="rounded-xl mt-1" data-testid="uf-password" /></div>
                    <div>
                      <Label className="text-xs">Rol</Label>
                      <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="uf-role">
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowUserForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="uf-submit">Crear</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-6 animate-fade-in" data-testid="admin-settings">
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> WhatsApp</h2>
              <p className="text-sm text-muted-foreground mb-4">Configura el número de WhatsApp para el widget de chat</p>
              <div className="flex gap-2">
                <Input value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} placeholder="+502 5555-1234" className="rounded-xl" data-testid="whatsapp-input" />
                <Button onClick={saveWhatsApp} className="rounded-xl bg-primary hover:bg-primary/90" data-testid="save-whatsapp-btn">Guardar</Button>
              </div>
            </div>
            <a href="/chat" className="block">
              <div className="bg-white rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors">
                <h2 className="font-heading text-lg font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Centro de Mensajes</h2>
                <p className="text-sm text-muted-foreground">Ver y responder conversaciones con socios</p>
                {(stats.unread_chats || 0) > 0 && <Badge className="rounded-full bg-primary mt-2">{stats.unread_chats} sin leer</Badge>}
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
