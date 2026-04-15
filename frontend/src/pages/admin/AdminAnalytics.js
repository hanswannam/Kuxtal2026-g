import React from 'react';
import { Badge } from '../../components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartPie, Pie, Cell } from 'recharts';

export function AdminAnalytics({ analytics, stats }) {
  if (!analytics) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-analytics">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {analytics.top_packages?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="font-heading text-lg font-semibold mb-4">Top Paquetes por Cotizaciones</h3>
            <div className="space-y-3">
              {analytics.top_packages.map((p, i) => (
                <div key={p.name || i} className="flex items-center justify-between" data-testid={`top-pkg-${i}`}>
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

        {analytics.country_distribution?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="font-heading text-lg font-semibold mb-4">Distribucion por Pais</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartPie>
                <Pie data={analytics.country_distribution} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={80} label={({ country, count }) => `${country} (${count})`}>
                  {analytics.country_distribution.map((entry, i) => (
                    <Cell key={entry.country || i} fill={['#C1121F','#1E40AF','#059669','#D97706','#7C3AED','#DB2777'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        )}
      </div>

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
  );
}
