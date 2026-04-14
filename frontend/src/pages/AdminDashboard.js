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
  Plus, Trash2, Edit, Eye, Search, X, Send, Phone, CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const ax = axios.create({ baseURL: `${API}/api`, withCredentials: true });

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

  // Modals
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [quotationResponse, setQuotationResponse] = useState({ id: '', response: '' });

  const [memberForm, setMemberForm] = useState({ contract_number: '', dpi: '', name: '', email: '', phone: '', service_years: 1, membership_start: '', membership_end: '', family_members_allowed: 1, status: 'active' });
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
  const deleteMember = async (id) => { if (window.confirm('¿Eliminar socio?')) { await ax.delete(`/members/${id}`); loadData(); toast.success('Eliminado'); }};

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
  const deletePkg = async (id) => { if (window.confirm('¿Eliminar paquete?')) { await ax.delete(`/packages/${id}`); loadData(); toast.success('Eliminado'); }};
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
  const deleteAnn = async (id) => { await ax.delete(`/announcements/${id}`); loadData(); toast.success('Eliminado'); };

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

  // Vacation request status
  const updateReqStatus = async (id, status) => {
    await ax.put(`/vacation-requests/${id}/status`, { status });
    toast.success('Estado actualizado');
    loadData();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Socios', icon: Users },
    { id: 'packages', label: 'Paquetes', icon: Package },
    { id: 'quotations', label: 'Cotizaciones', icon: FileText },
    { id: 'announcements', label: 'Anuncios', icon: Bell },
    { id: 'requests', label: 'Solicitudes', icon: MessageSquare },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-20 bg-secondary/20" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Panel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gestión CRM de Kuxtal Travel</p>
          </div>
          <Badge className="rounded-full bg-primary/10 text-primary border-0 px-3">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-border mb-6 overflow-x-auto" data-testid="admin-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              data-testid={`admin-tab-${t.id}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Socios Activos', value: stats.active_members || 0, icon: Users, color: 'text-emerald-600' },
                { label: 'Paquetes', value: stats.total_packages || 0, icon: Package, color: 'text-blue-600' },
                { label: 'Cotizaciones Pendientes', value: stats.pending_quotations || 0, icon: FileText, color: 'text-amber-600' },
                { label: 'Solicitudes Pendientes', value: stats.pending_requests || 0, icon: MessageSquare, color: 'text-purple-600' },
                { label: 'Anuncios Activos', value: stats.total_announcements || 0, icon: Bell, color: 'text-rose-600' },
                { label: 'Total Socios', value: stats.total_members || 0, icon: BarChart3, color: 'text-primary' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-border" data-testid={`stat-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-secondary ${s.color}`}><s.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                            <Button size="sm" variant="ghost" onClick={() => deleteMember(m._id)} className="text-destructive" data-testid={`delete-member-${i}`}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                        <Button size="sm" variant="ghost" onClick={() => deletePkg(p._id)} className="text-destructive" data-testid={`delete-pkg-${i}`}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                    <div><Label className="text-xs">URL Imagen</Label><Input value={packageForm.image_url} onChange={e => setPackageForm({...packageForm, image_url: e.target.value})} className="rounded-xl mt-1" data-testid="pf-image" /></div>
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
                  <Button size="sm" variant="ghost" onClick={() => deleteAnn(a._id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
          </div>
        )}
      </div>
    </div>
  );
}
