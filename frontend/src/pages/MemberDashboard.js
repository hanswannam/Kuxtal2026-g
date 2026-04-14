import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, FileText, Bell, MessageSquare, Send, Clock, CheckCircle2, Package, Star, Store, Gift, Users, Plus, Trash2, Share2, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

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

  useEffect(() => {
    if (user?.member) setMember(user.member);
    else if (user?.member_id) {
      axios.get(`${API}/api/auth/me`, { withCredentials: true }).then(r => setMember(r.data.member)).catch(() => {});
    }
    axios.get(`${API}/api/quotations`, { withCredentials: true }).then(r => setQuotations(r.data)).catch(() => {});
    axios.get(`${API}/api/announcements?target=members`).then(r => setAnnouncements(r.data)).catch(() => {});
    axios.get(`${API}/api/vacation-requests`, { withCredentials: true }).then(r => setVacationRequests(r.data)).catch(() => {});
    axios.get(`${API}/api/packages?featured=true`).then(r => setPackages(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/api/commerce`).then(r => setCommerces(r.data.slice(0, 4))).catch(() => {});
    // Load family members if member_id available
    const memberId = user?.member?._id || user?.member_id;
    if (memberId) {
      axios.get(`${API}/api/members/${memberId}/family`, { withCredentials: true }).then(r => setFamilyMembers(r.data)).catch(() => {});
    }
    axios.get(`${API}/api/referral/my-code`, { withCredentials: true }).then(r => setReferralData(r.data)).catch(() => {});
  }, [user]);

  const submitRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/vacation-requests`, reqForm, { withCredentials: true });
      toast.success('Solicitud enviada');
      setShowRequestForm(false);
      setReqForm({ destination: '', travel_date: '', guests: 1, message: '' });
      const r = await axios.get(`${API}/api/vacation-requests`, { withCredentials: true });
      setVacationRequests(r.data);
    } catch { toast.error('Error al enviar solicitud'); }
  };

  const addFamilyMember = async (e) => {
    e.preventDefault();
    const memberId = member?._id || user?.member_id;
    try {
      await axios.post(`${API}/api/members/${memberId}/family`, familyForm, { withCredentials: true });
      toast.success('Familiar agregado');
      setShowFamilyForm(false);
      setFamilyForm({ name: '', dpi: '', relationship: 'familiar' });
      const r = await axios.get(`${API}/api/members/${memberId}/family`, { withCredentials: true });
      setFamilyMembers(r.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al agregar familiar');
    }
  };

  const removeFamilyMember = async (familyId) => {
    const memberId = member?._id || user?.member_id;
    await axios.delete(`${API}/api/members/${memberId}/family/${familyId}`, { withCredentials: true });
    toast.success('Familiar eliminado');
    const r = await axios.get(`${API}/api/members/${memberId}/family`, { withCredentials: true });
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Hola, {member?.name || user?.name || 'Socio'}
          </h1>
          <p className="text-muted-foreground text-sm">Bienvenido a tu portal de socio</p>
        </div>

        {/* Tabs - attractive grid buttons */}
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

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Member Info Card */}
            {member && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border" data-testid="member-info-card">
                <h2 className="font-heading text-lg font-semibold mb-4">Mi Membresía</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Contrato</p>
                    <p className="font-semibold text-base sm:text-lg">{member.contract_number}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Años de Servicio</p>
                    <p className="font-semibold text-base sm:text-lg">{member.service_years} años</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Vigencia</p>
                    <p className="font-semibold text-xs sm:text-sm">{member.membership_start} - {member.membership_end}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-accent/50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Familiares</p>
                    <p className="font-semibold text-base sm:text-lg">{member.family_members_allowed} personas</p>
                  </div>
                  {(member.investment_amount > 0 || member.investment_plan) && (
                    <div className="p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/10 col-span-2">
                      <p className="text-[10px] sm:text-xs text-primary uppercase tracking-wider mb-1 font-semibold">Inversión</p>
                      <p className="font-bold text-xl sm:text-2xl text-primary">Q.{(member.investment_amount || 0).toLocaleString()}</p>
                      {member.investment_plan && <p className="text-xs text-muted-foreground mt-1">{member.investment_plan}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-xl"><FileText className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{quotations.length}</p>
                    <p className="text-xs text-muted-foreground">Cotizaciones</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-xl"><Bell className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{announcements.length}</p>
                    <p className="text-xs text-muted-foreground">Anuncios</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-xl"><MessageSquare className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{vacationRequests.length}</p>
                    <p className="text-xs text-muted-foreground">Solicitudes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Packages */}
            {packages.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h2 className="font-heading text-lg font-semibold mb-4">Promociones Exclusivas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {packages.map(pkg => (
                    <a key={pkg._id} href={`/trip/${pkg._id}`} className="group rounded-xl overflow-hidden border border-border hover:shadow-md transition-all">
                      <div className="aspect-video overflow-hidden">
                        <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{pkg.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{pkg.duration_days} días</span>
                          <span className="text-sm font-bold text-primary">Q.{pkg.member_price > 0 ? pkg.member_price.toLocaleString() : pkg.price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quotations Tab */}
        {tab === 'quotations' && (
          <div className="space-y-4 animate-fade-in" data-testid="member-quotations">
            {quotations.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin cotizaciones</h3>
                <p className="text-sm text-muted-foreground">Tus cotizaciones aparecerán aquí</p>
              </div>
            ) : (
              quotations.map((q, i) => (
                <div key={q._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`quotation-${i}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Cotización #{q._id?.slice(-6)}</h3>
                      <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString('es')}</p>
                    </div>
                    <Badge variant={q.status === 'responded' ? 'default' : 'secondary'} className="rounded-full">
                      {q.status === 'pending' ? 'Pendiente' : 'Respondida'}
                    </Badge>
                  </div>
                  {q.message && <p className="text-sm text-muted-foreground mb-2">{q.message}</p>}
                  {q.response_html && (
                    <div className="mt-3 p-4 bg-accent/50 rounded-xl text-sm" dangerouslySetInnerHTML={{ __html: q.response_html }} />
                  )}
                  {q.response && !q.response_html && (
                    <div className="mt-3 p-4 bg-accent/50 rounded-xl text-sm">{q.response}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {tab === 'announcements' && (
          <div className="space-y-4 animate-fade-in" data-testid="member-announcements">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin anuncios</h3>
                <p className="text-sm text-muted-foreground">Los nuevos anuncios aparecerán aquí</p>
              </div>
            ) : (
              announcements.map((a, i) => (
                <div key={a._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`announcement-${i}`}>
                  <h3 className="font-heading text-lg font-semibold mb-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{a.content}</p>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-medium hover:underline">
                      Ver más
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">{new Date(a.created_at).toLocaleDateString('es')}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vacation Requests Tab */}
        {tab === 'requests' && (
          <div className="space-y-4 animate-fade-in" data-testid="member-requests">
            <div className="flex justify-end mb-2">
              <Button onClick={() => setShowRequestForm(true)} className="rounded-full bg-primary hover:bg-primary/90" data-testid="new-request-btn">
                <Send className="w-4 h-4 mr-2" /> Nueva Solicitud
              </Button>
            </div>
            {vacationRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin solicitudes</h3>
                <p className="text-sm text-muted-foreground">Envía tu primera solicitud de vacaciones</p>
              </div>
            ) : (
              vacationRequests.map((r, i) => (
                <div key={r._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`vacation-request-${i}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{r.destination}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {r.travel_date} &middot; {r.guests} huéspedes
                      </p>
                    </div>
                    <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="rounded-full">
                      {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </Badge>
                  </div>
                  {r.messages && r.messages.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-border">
                      {r.messages.map((m, j) => (
                        <div key={j} className="text-sm">
                          <span className="font-medium text-xs">{m.from}:</span>
                          <span className="text-muted-foreground ml-2">{m.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Request Form Modal */}
            {showRequestForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="request-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Nueva Solicitud de Vacaciones</h3>
                  <form onSubmit={submitRequest} className="space-y-4">
                    <div>
                      <Label>Destino</Label>
                      <Input value={reqForm.destination} onChange={e => setReqForm({...reqForm, destination: e.target.value})} required className="rounded-xl mt-1" data-testid="req-destination" />
                    </div>
                    <div>
                      <Label>Fecha de viaje</Label>
                      <Input type="date" value={reqForm.travel_date} onChange={e => setReqForm({...reqForm, travel_date: e.target.value})} required className="rounded-xl mt-1" data-testid="req-date" />
                    </div>
                    <div>
                      <Label>Huéspedes</Label>
                      <Input type="number" min="1" value={reqForm.guests} onChange={e => setReqForm({...reqForm, guests: parseInt(e.target.value)})} className="rounded-xl mt-1" data-testid="req-guests" />
                    </div>
                    <div>
                      <Label>Mensaje</Label>
                      <Textarea value={reqForm.message} onChange={e => setReqForm({...reqForm, message: e.target.value})} className="rounded-xl mt-1" data-testid="req-message" />
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="req-submit">Enviar</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Family Tab */}
        {tab === 'family' && (
          <div className="space-y-4 animate-fade-in" data-testid="member-family">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="font-heading text-lg font-semibold">Mi Familia</h2>
                <p className="text-xs text-muted-foreground">
                  {familyMembers.length} de {member?.family_members_allowed || 0} familiares registrados
                </p>
              </div>
              {familyMembers.length < (member?.family_members_allowed || 0) && (
                <Button onClick={() => setShowFamilyForm(true)} className="rounded-full bg-primary hover:bg-primary/90" data-testid="add-family-btn">
                  <Plus className="w-4 h-4 mr-2" /> Agregar Familiar
                </Button>
              )}
            </div>
            {familyMembers.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin familiares registrados</h3>
                <p className="text-sm text-muted-foreground mb-4">Agrega familiares para que puedan acceder a los beneficios del club</p>
                <p className="text-xs text-muted-foreground">Cada familiar podrá iniciar sesión con el mismo número de contrato y su propio DPI</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {familyMembers.map((fm, i) => (
                  <div key={fm._id} className="bg-white rounded-2xl p-5 border border-border" data-testid={`family-member-${i}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{fm.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{fm.relationship}</p>
                          <p className="text-xs text-muted-foreground mt-1">DPI: ****{fm.dpi?.slice(-4)}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeFamilyMember(fm._id)} className="text-destructive" data-testid={`remove-family-${i}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showFamilyForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" data-testid="family-form-modal">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="font-heading text-xl font-semibold mb-4">Agregar Familiar</h3>
                  <form onSubmit={addFamilyMember} className="space-y-4">
                    <div>
                      <Label>Nombre completo</Label>
                      <Input value={familyForm.name} onChange={e => setFamilyForm({...familyForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="family-name" />
                    </div>
                    <div>
                      <Label>DPI</Label>
                      <Input value={familyForm.dpi} onChange={e => setFamilyForm({...familyForm, dpi: e.target.value})} required placeholder="Número de DPI del familiar" className="rounded-xl mt-1" data-testid="family-dpi" />
                    </div>
                    <div>
                      <Label>Parentesco</Label>
                      <select value={familyForm.relationship} onChange={e => setFamilyForm({...familyForm, relationship: e.target.value})} className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm" data-testid="family-relationship">
                        <option value="esposo/a">Esposo/a</option>
                        <option value="hijo/a">Hijo/a</option>
                        <option value="padre/madre">Padre/Madre</option>
                        <option value="hermano/a">Hermano/a</option>
                        <option value="familiar">Otro familiar</option>
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">El familiar podrá iniciar sesión con el contrato <strong>{member?.contract_number}</strong> y su DPI personal</p>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowFamilyForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="family-submit">Agregar</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Referral Tab */}
        {tab === 'referral' && (
          <div className="space-y-6 animate-fade-in" data-testid="member-referrals">
            {/* Referral Code Card */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent rounded-xl"><Share2 className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="font-heading text-lg font-semibold">Tu Código de Referido</h2>
                  <p className="text-xs text-muted-foreground">Comparte este enlace con amigos y familiares</p>
                </div>
              </div>
              {referralData?.code ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-secondary rounded-xl font-mono font-bold text-lg text-center text-primary" data-testid="referral-code">
                      {referralData.code}
                    </div>
                    <Button variant="outline" className="rounded-xl shrink-0" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/referral/${referralData.code}`);
                      toast.success('Enlace copiado');
                    }} data-testid="copy-referral">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={() => {
                      window.open(`https://wa.me/?text=${encodeURIComponent(`Te invito a conocer Kuxtal Travel Club: ${window.location.origin}/referral/${referralData.code}`)}`, '_blank');
                    }} data-testid="share-wa-referral">
                      <MessageCircle className="w-4 h-4 mr-2" /> Compartir por WhatsApp
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
                      window.open(`mailto:?subject=${encodeURIComponent('Invitación a Kuxtal Travel')}&body=${encodeURIComponent(`Te invito a conocer Kuxtal Travel Club: ${window.location.origin}/referral/${referralData.code}`)}`, '_blank');
                    }} data-testid="share-email-referral">
                      <Send className="w-4 h-4 mr-2" /> Email
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cargando tu código...</p>
              )}
            </div>

            {/* Referral Stats */}
            <div className="bg-white rounded-2xl p-6 border border-border">
              <h3 className="font-heading text-lg font-semibold mb-4">Mis Referidos ({referralData?.total || 0})</h3>
              {(!referralData?.referrals || referralData.referrals.length === 0) ? (
                <div className="text-center py-8">
                  <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aún no tienes referidos. ¡Comparte tu código!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralData.referrals.map((r, i) => (
                    <div key={r._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl" data-testid={`my-referral-${i}`}>
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('es')}</p>
                      </div>
                      <Badge variant={r.status === 'converted' ? 'default' : 'secondary'} className="rounded-full text-xs">
                        {r.status === 'pending' ? 'Pendiente' : r.status === 'contacted' ? 'Contactado' : r.status === 'converted' ? 'Convertido' : r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits Tab */}
        {tab === 'benefits' && (
          <div className="space-y-4 animate-fade-in" data-testid="member-benefits">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-heading text-lg font-semibold">Comercios Aliados</h2>
              <Link to="/benefits">
                <Button variant="outline" size="sm" className="rounded-full" data-testid="view-all-benefits">Ver todos</Button>
              </Link>
            </div>
            {commerces.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-border text-center">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Sin comercios disponibles</h3>
                <p className="text-sm text-muted-foreground">Pronto se agregarán comercios con beneficios</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {commerces.map((c, i) => (
                  <Link key={c._id} to={`/commerce/${c._id}`} className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-all group" data-testid={`member-commerce-${i}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-xl shrink-0">🏪</div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                        <Badge variant="secondary" className="rounded-full text-xs mt-1">{c.category}</Badge>
                      </div>
                    </div>
                    {c.benefit_description && (
                      <div className="p-3 bg-accent/50 rounded-xl">
                        <div className="flex items-center gap-2 text-primary text-sm font-medium">
                          <Gift className="w-4 h-4 shrink-0" />
                          <span className="line-clamp-2">{c.benefit_description}</span>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
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
