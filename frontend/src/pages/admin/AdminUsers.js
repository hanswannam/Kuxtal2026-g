import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import api from '../../lib/api';

export function AdminUsers({ adminUsers, allUsers, showUserForm, setShowUserForm, userForm, setUserForm, userView, setUserView, loadUsers }) {
  return (
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
                        try { await api.put(`/admin/users/${u._id}/toggle-active`); loadUsers(); toast.success('Estado actualizado'); }
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
                      try { await api.delete(`/admin/users/${u._id}?delete_code=${encodeURIComponent(code)}`); loadUsers(); toast.success('Eliminado'); }
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
            <form onSubmit={async (e) => { e.preventDefault(); try { await api.post('/admin/users', userForm); toast.success('Usuario creado'); setShowUserForm(false); setUserForm({ name: '', email: '', password: '', role: 'admin' }); loadUsers(); } catch (err) { toast.error(err.response?.data?.detail || 'Error'); } }} className="space-y-3">
              <div><Label className="text-xs">Nombre</Label><Input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required className="rounded-xl mt-1" data-testid="uf-name" /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required className="rounded-xl mt-1" data-testid="uf-email" /></div>
              <div><Label className="text-xs">Contrasenia</Label><Input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required className="rounded-xl mt-1" data-testid="uf-password" /></div>
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
  );
}
