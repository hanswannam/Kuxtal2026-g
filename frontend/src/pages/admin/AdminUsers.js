import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Plus, Shield, X, Check, Search, Pencil, KeyRound, Eye, EyeOff, History } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteWithCode } from '../../components/DeleteWithCode';
import api from '../../lib/api';

const FEATURE_LABELS = {
  dashboard: 'Dashboard',
  quotations: 'Cotizaciones',
  clients: 'Clientes',
  members: 'Socios',
  packages: 'Paquetes',
  commerce: 'Comercios',
  categories: 'Categorías',
  clubs: 'Clubs',
  regalias: 'Regalías',
  analytics: 'Analytics',
  announcements: 'Anuncios',
  push: 'Notificaciones push',
  referrals: 'Referidos',
  users: 'Usuarios',
  settings: 'Configuración',
};

export function AdminUsers({ adminUsers, allUsers, showUserForm, setShowUserForm, userForm, setUserForm, userView, setUserView, loadUsers }) {
  const [permsUser, setPermsUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [auditUser, setAuditUser] = useState(null);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const sourceList = userView === 'admins' ? adminUsers : allUsers;
  const norm = (s) => (s || '').toString().toLowerCase();
  const filteredUsers = useMemo(() => sourceList.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    const active = u.is_active !== false;
    if (statusFilter === 'active' && !active) return false;
    if (statusFilter === 'inactive' && active) return false;
    if (q.trim()) {
      const n = norm(q);
      if (!norm(u.name).includes(n) && !norm(u.email).includes(n)) return false;
    }
    return true;
  }), [sourceList, q, roleFilter, statusFilter]);

  const availableRoles = useMemo(() => Array.from(new Set(sourceList.map(u => u.role).filter(Boolean))).sort(), [sourceList]);

  return (
    <div className="animate-fade-in" data-testid="admin-users">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Control de Usuarios ({filteredUsers.length}{filteredUsers.length !== sourceList.length ? ` de ${sourceList.length}` : ''})
          </h2>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant={userView === 'admins' ? 'default' : 'outline'} className="rounded-full text-xs" onClick={() => setUserView('admins')}>Administradores ({adminUsers.length})</Button>
            <Button size="sm" variant={userView === 'all' ? 'default' : 'outline'} className="rounded-full text-xs" onClick={() => setUserView('all')}>Todos ({allUsers.length})</Button>
          </div>
        </div>
        <Button onClick={() => setShowUserForm(true)} className="rounded-full bg-primary hover:bg-primary/90" data-testid="add-user-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Admin
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-testid="user-filters">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o email..." className="pl-9 rounded-xl" data-testid="user-search" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="user-filter-role">
          <option value="">Todos los roles</option>
          {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-input px-3 text-sm bg-white" data-testid="user-filter-status">
          <option value="">Activos e inactivos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
        {(q || roleFilter || statusFilter) && (
          <button type="button" onClick={() => { setQ(''); setRoleFilter(''); setStatusFilter(''); }} className="h-10 rounded-xl bg-secondary hover:bg-secondary/70 text-xs font-medium px-3 sm:col-span-2 lg:col-span-4" data-testid="user-clear-filters">
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr><th className="text-left p-3 font-medium">Nombre</th><th className="text-left p-3 font-medium">Email</th><th className="text-left p-3 font-medium">Rol</th><th className="text-center p-3 font-medium">Estado</th><th className="text-right p-3 font-medium">Acciones</th></tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground" data-testid="user-empty">No se encontraron usuarios con los filtros aplicados</td></tr>
              )}
              {filteredUsers.map((u, i) => (
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
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setEditUser(u)} className="text-foreground/70 hover:text-primary" title="Editar nombre y email" data-testid={`edit-user-${i}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setResetUser(u)} className="text-amber-600 hover:text-amber-700" title="Resetear contraseña" data-testid={`reset-password-${i}`}>
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAuditUser(u)} className="text-foreground/70 hover:text-primary" title="Historial de cambios" data-testid={`audit-user-${i}`}>
                        <History className="w-3.5 h-3.5" />
                      </Button>
                      {(u.role === 'admin' || u.role === 'super_admin') && (
                        <Button size="sm" variant="ghost" onClick={() => setPermsUser(u)} className="text-primary" title="Permisos" data-testid={`perms-user-${i}`}>
                          <Shield className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <DeleteWithCode onConfirm={async (code) => {
                        try { await api.delete(`/admin/users/${u._id}?delete_code=${encodeURIComponent(code)}`); loadUsers(); toast.success('Eliminado'); }
                        catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="user-form-modal">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-heading text-xl font-semibold mb-4">Nuevo Administrador</h3>
            <form onSubmit={async (e) => { e.preventDefault(); try { await api.post('/admin/users', userForm); toast.success('Usuario creado'); setShowUserForm(false); setUserForm({ name: '', email: '', password: '', role: 'admin' }); loadUsers(); } catch (err) { toast.error(err.response?.data?.detail || 'Error'); } }} className="space-y-3">
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
              <p className="text-[11px] text-muted-foreground">Nuevos administradores comienzan con acceso a Dashboard, Cotizaciones, Clientes y Socios. Puedes configurar más permisos luego con el botón escudo.</p>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowUserForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="uf-submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {permsUser && <PermissionsModal user={permsUser} onClose={() => setPermsUser(null)} onSaved={() => { loadUsers(); setPermsUser(null); }} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { loadUsers(); setEditUser(null); }} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSaved={() => setResetUser(null)} />}
      {auditUser && <AuditHistoryModal user={auditUser} onClose={() => setAuditUser(null)} />}
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/users/${user._id}`, { name: name.trim(), email: email.trim().toLowerCase() });
      toast.success('Usuario actualizado');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al actualizar');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="edit-user-modal">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-xl font-semibold">Editar usuario</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rol: {user.role}</p>
          </div>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="rounded-xl mt-1" data-testid="edit-user-name" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl mt-1" data-testid="edit-user-email" />
            <p className="text-[11px] text-muted-foreground mt-1">Este email se usará para iniciar sesión.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="edit-user-submit">{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const randomPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
    setConfirm(p);
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await api.post(`/admin/users/${user._id}/reset-password`, { password });
      try { await navigator.clipboard.writeText(password); } catch (_) {}
      toast.success('Contraseña actualizada (copiada al portapapeles)');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al actualizar');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="reset-password-modal">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-xl font-semibold">Resetear contraseña</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user.name} · {user.email}</p>
          </div>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Nueva contraseña</Label>
              <button type="button" onClick={randomPass} className="text-[11px] text-primary hover:underline" data-testid="generate-password">Generar aleatoria</button>
            </div>
            <div className="relative mt-1">
              <Input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="rounded-xl pr-10" data-testid="reset-password-input" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Confirmar contraseña</Label>
            <Input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} className="rounded-xl mt-1" data-testid="reset-password-confirm" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Importante:</strong> Comparte la nueva contraseña con el usuario de forma segura. Se copiará al portapapeles al guardar.
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary hover:bg-primary/90" data-testid="reset-password-submit">{saving ? 'Guardando...' : 'Resetear'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsModal({ user, onClose, onSaved }) {
  const initial = user.permissions || {};
  const [perms, setPerms] = useState(Object.fromEntries(Object.keys(FEATURE_LABELS).map(k => [k, !!initial[k]])));
  const [saving, setSaving] = useState(false);

  const toggle = (k) => setPerms(p => ({ ...p, [k]: !p[k] }));
  const toggleAll = (on) => setPerms(Object.fromEntries(Object.keys(FEATURE_LABELS).map(k => [k, on])));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${user._id}/permissions`, { permissions: perms });
      toast.success('Permisos actualizados');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    }
    setSaving(false);
  };

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="perms-modal">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-xl font-semibold">Permisos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user.name} · {user.email}</p>
          </div>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {isSuperAdmin ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Super Admin</p>
            <p className="text-xs text-muted-foreground mt-1">Los Super Admins tienen acceso total a toda la aplicación.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={() => toggleAll(true)} className="rounded-full text-xs flex-1">Marcar todo</Button>
              <Button size="sm" variant="outline" onClick={() => toggleAll(false)} className="rounded-full text-xs flex-1">Desmarcar todo</Button>
            </div>
            <div className="space-y-1.5 mb-5">
              {Object.entries(FEATURE_LABELS).map(([k, label]) => (
                <button key={k} type="button" onClick={() => toggle(k)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-sm ${perms[k] ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  data-testid={`perm-${k}`}>
                  <span className="font-medium">{label}</span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${perms[k] ? 'bg-primary border-primary' : 'border-border'}`}>
                    {perms[k] && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-primary" data-testid="perms-save">{saving ? 'Guardando...' : 'Guardar permisos'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


const ACTION_LABELS = {
  create_user: { label: 'Creación de usuario', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  update_profile: { label: 'Edición de perfil', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  reset_password: { label: 'Reset de contraseña', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  toggle_active: { label: 'Cambio de estado', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  update_permissions: { label: 'Cambio de permisos', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  delete_user: { label: 'Eliminación', color: 'bg-red-50 text-red-700 border-red-200' },
};

function AuditHistoryModal({ user, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`/admin/audit/user-changes?target_user_id=${user._id}`);
        if (mounted) setEntries(data || []);
      } catch (e) {
        toast.error(e.response?.data?.detail || 'Error al cargar historial');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user._id]);

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso; }
  };

  const renderDetails = (action, details) => {
    if (!details) return null;
    if (action === 'update_profile') {
      return (
        <div className="space-y-1 text-xs">
          {Object.entries(details).map(([field, change]) => (
            <div key={field} className="flex items-start gap-2">
              <span className="font-medium capitalize text-muted-foreground w-14">{field}:</span>
              <span className="text-red-600 line-through break-all">{String(change.before || '—')}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-emerald-700 font-medium break-all">{String(change.after || '—')}</span>
            </div>
          ))}
        </div>
      );
    }
    if (action === 'reset_password') {
      return <div className="text-xs text-muted-foreground">Nueva contraseña ({details.password_length} caracteres)</div>;
    }
    if (action === 'toggle_active') {
      return <div className="text-xs text-muted-foreground">{details.before ? 'Activo' : 'Inactivo'} → <span className="font-medium text-foreground">{details.after ? 'Activo' : 'Inactivo'}</span></div>;
    }
    if (action === 'update_permissions') {
      const before = details.before || {};
      const after = details.after || {};
      const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
      const diffs = keys.filter(k => !!before[k] !== !!after[k]);
      if (!diffs.length) return <div className="text-xs text-muted-foreground">Sin cambios detectables</div>;
      return (
        <div className="text-xs space-y-0.5">
          {diffs.map(k => (
            <div key={k}>
              <span className="font-medium">{FEATURE_LABELS[k] || k}:</span>{' '}
              <span className={before[k] ? 'text-red-600' : 'text-muted-foreground'}>{before[k] ? 'sí' : 'no'}</span>
              {' → '}
              <span className={after[k] ? 'text-emerald-700 font-medium' : 'text-muted-foreground'}>{after[k] ? 'sí' : 'no'}</span>
            </div>
          ))}
        </div>
      );
    }
    if (action === 'create_user') {
      return <div className="text-xs text-muted-foreground">Rol: <span className="font-medium text-foreground">{details.role}</span></div>;
    }
    if (action === 'delete_user') {
      return <div className="text-xs text-muted-foreground">Email: {details.email} · Rol: {details.role}</div>;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="audit-history-modal">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-xl font-semibold">Historial de cambios</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user.name} · {user.email}</p>
          </div>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground" data-testid="audit-empty">
            Sin cambios registrados todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e, i) => {
              const meta = ACTION_LABELS[e.action] || { label: e.action, color: 'bg-secondary text-foreground border-border' };
              return (
                <div key={e._id || i} className="border border-border rounded-xl p-3" data-testid={`audit-entry-${i}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className={`rounded-full text-[11px] ${meta.color}`}>{meta.label}</Badge>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDate(e.timestamp)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Por <span className="font-medium text-foreground">{e.admin_name || e.admin_email}</span>
                    {e.ip && <span> · IP {e.ip}</span>}
                  </div>
                  {renderDetails(e.action, e.details)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
