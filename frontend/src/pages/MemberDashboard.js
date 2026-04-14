import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, FileText, Bell, MessageSquare, Send, Clock, CheckCircle2, Package, Star, Store, Gift } from 'lucide-react';
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
  const [showRequestForm, setShowRequestForm] = useState(false);
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

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Package },
    { id: 'quotations', label: 'Cotizaciones', icon: FileText },
    { id: 'announcements', label: 'Anuncios', icon: Bell },
    { id: 'requests', label: 'Solicitudes', icon: MessageSquare },
    { id: 'benefits', label: 'Beneficios', icon: Store },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary/20" data-testid="member-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-1">
            Hola, {member?.name || user?.name || 'Socio'}
          </h1>
          <p className="text-muted-foreground text-sm">Bienvenido a tu portal de socio</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-border mb-8 overflow-x-auto" data-testid="member-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              data-testid={`member-tab-${t.id}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Member Info Card */}
            {member && (
              <div className="bg-white rounded-2xl p-6 border border-border" data-testid="member-info-card">
                <h2 className="font-heading text-lg font-semibold mb-4">Mi Membresía</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-accent/50 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contrato</p>
                    <p className="font-semibold text-lg">{member.contract_number}</p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Años de Servicio</p>
                    <p className="font-semibold text-lg">{member.service_years} años</p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vigencia</p>
                    <p className="font-semibold text-sm">{member.membership_start} - {member.membership_end}</p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Familiares</p>
                    <p className="font-semibold text-lg">{member.family_members_allowed} personas</p>
                  </div>
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
    </div>
  );
}
