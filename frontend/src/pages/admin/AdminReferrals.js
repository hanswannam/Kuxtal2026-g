import React from 'react';
import { Badge } from '../../components/ui/badge';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export function AdminReferrals({ referrals, loadData }) {
  return (
    <div className="animate-fade-in" data-testid="admin-referrals">
      <h2 className="font-heading text-lg font-semibold mb-4">Referidos ({referrals.length})</h2>
      {referrals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-border text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold mb-2">Sin referidos</h3>
          <p className="text-sm text-muted-foreground">Los referidos de los socios apareceran aqui</p>
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
                <th className="text-right p-3 font-medium">Accion</th>
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
                      onChange={async (e) => { await api.put(`/referrals/${r._id}/status`, { status: e.target.value }); loadData(); toast.success('Estado actualizado'); }}
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
  );
}
