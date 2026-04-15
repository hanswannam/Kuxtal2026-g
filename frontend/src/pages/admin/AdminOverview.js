import React from 'react';
import { Users, Package, FileText, Bell, MessageSquare, Clock, Store, Gift } from 'lucide-react';

export function AdminOverview({ stats, setTab, setShowMemberForm, setEditingMember, setShowPackageForm, setEditingPackage }) {
  const statCards = [
    { label: 'Socios Activos', value: stats.active_members || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'members' },
    { label: 'Paquetes', value: stats.total_packages || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'packages' },
    { label: 'Cotizaciones', value: stats.pending_quotations || 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'quotations' },
    { label: 'Comercios', value: stats.total_commerce || 0, icon: Store, color: 'text-violet-600', bg: 'bg-violet-50', tab: 'commerce' },
    { label: 'Referidos', value: stats.total_referrals || 0, icon: Gift, color: 'text-indigo-600', bg: 'bg-indigo-50', tab: 'referrals' },
    { label: 'Chats', value: stats.unread_chats || 0, icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50', tab: 'settings' },
    { label: 'Solicitudes', value: stats.pending_requests || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', tab: 'requests' },
    { label: 'Anuncios', value: stats.total_announcements || 0, icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50', tab: 'announcements' },
  ];

  const quickActions = [
    { label: 'Nuevo Socio', icon: Users, action: () => { setTab('members'); setTimeout(() => { setShowMemberForm(true); setEditingMember(null); }, 100); }, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Nuevo Paquete', icon: Package, action: () => { setTab('packages'); setTimeout(() => { setShowPackageForm(true); setEditingPackage(null); }, 100); }, color: 'from-blue-500 to-blue-600' },
    { label: 'Nuevo Comercio', icon: Store, action: () => window.location.href = '/admin/new-commerce', color: 'from-violet-500 to-violet-600' },
    { label: 'Ver Mensajes', icon: MessageSquare, action: () => window.location.href = '/chat', color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-border hover:shadow-md transition-all cursor-pointer" onClick={() => setTab(s.tab)} data-testid={`stat-${s.tab}`}>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <button key={a.label} onClick={a.action}
            className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${a.color} text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all`}
            data-testid={`quick-action-${a.label.replace(/\s/g, '-').toLowerCase()}`}>
            <a.icon className="w-5 h-5" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
