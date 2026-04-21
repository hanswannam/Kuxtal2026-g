import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Check, X, User, Users, Package, Plus } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

/**
 * Searchable package dropdown. Replaces <select> with client-side filter.
 */
export function PackageSearchSelect({ value, onChange, testId = 'pkg-select' }) {
  const [packages, setPackages] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    api.get('/packages').then(r => setPackages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const norm = (s) => (s || '').toString().toLowerCase();
  const filtered = useMemo(() => {
    const n = norm(q);
    if (!n) return packages.slice(0, 50);
    return packages.filter(p => norm(p.title).includes(n) || norm(p.country).includes(n) || norm(p.category).includes(n)).slice(0, 50);
  }, [packages, q]);

  const selected = packages.find(p => p._id === value);

  return (
    <div ref={wrapRef} className="relative" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full mt-1 h-10 rounded-xl border border-input px-3 text-sm text-left flex items-center justify-between bg-white hover:border-primary/50"
      >
        <span className="truncate">
          {selected ? (
            <>
              <span className="font-medium">{selected.title}</span>
              <span className="text-muted-foreground"> · {selected.country}</span>
            </>
          ) : <span className="text-muted-foreground">— Seleccionar paquete —</span>}
        </span>
        {value ? (
          <span role="button" onClick={e => { e.stopPropagation(); onChange(''); }} className="text-muted-foreground hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </span>
        ) : <Search className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-border shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por título, país o categoría..." className="pl-8 rounded-lg h-9 text-xs" data-testid={`${testId}-search`} />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && <p className="p-3 text-xs text-muted-foreground">Sin resultados</p>}
            {filtered.map(p => (
              <button
                type="button"
                key={p._id}
                onClick={() => { onChange(p._id); setOpen(false); setQ(''); }}
                className="w-full text-left px-3 py-2 hover:bg-secondary/60 text-sm flex items-center gap-2 border-b border-border/50 last:border-0"
                data-testid={`${testId}-opt-${p._id}`}
              >
                <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.country} · {p.duration_days}d · Q.{(p.price||0).toLocaleString()}</p>
                </div>
                {value === p._id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Customer (member or client) picker. Tabs: Socio | Cliente | Nuevo.
 * Calls onChange({ type: 'member'|'client'|'new', member_id?, client_id?, name?, email?, phone? })
 */
export function CustomerPicker({ value, onChange }) {
  const [tab, setTab] = useState(value?.type || 'new');
  const [members, setMembers] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchMembers, setSearchMembers] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [newData, setNewData] = useState({ name: value?.name || '', email: value?.email || '', phone: value?.phone || '' });

  useEffect(() => {
    if (tab === 'member' && members.length === 0) {
      api.get('/members').then(r => setMembers(r.data)).catch(() => {});
    }
    if (tab === 'client' && clients.length === 0) {
      api.get('/clients').then(r => setClients(r.data)).catch(() => {});
    }
  }, [tab, members.length, clients.length]);

  const norm = (s) => (s || '').toString().toLowerCase();
  const filteredMembers = useMemo(() => {
    const n = norm(searchMembers);
    return members.filter(m => !n || norm(m.name).includes(n) || norm(m.contract_number).includes(n) || norm(m.email).includes(n) || norm(m.phone).includes(n)).slice(0, 30);
  }, [members, searchMembers]);
  const filteredClients = useMemo(() => {
    const n = norm(searchClients);
    return clients.filter(c => !n || norm(c.name).includes(n) || norm(c.email).includes(n) || norm(c.phone).includes(n)).slice(0, 30);
  }, [clients, searchClients]);

  const pick = (payload) => {
    onChange(payload);
  };

  const updateNew = (k, v) => {
    const next = { ...newData, [k]: v };
    setNewData(next);
    onChange({ type: 'new', ...next });
  };

  return (
    <div className="rounded-xl border border-border bg-white" data-testid="customer-picker">
      <div className="grid grid-cols-3 border-b border-border">
        <button type="button" onClick={() => setTab('member')} className={`p-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${tab === 'member' ? 'bg-primary text-white' : 'hover:bg-secondary'}`} data-testid="cp-tab-member">
          <Users className="w-3.5 h-3.5" /> Socio
        </button>
        <button type="button" onClick={() => setTab('client')} className={`p-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${tab === 'client' ? 'bg-primary text-white' : 'hover:bg-secondary'}`} data-testid="cp-tab-client">
          <User className="w-3.5 h-3.5" /> Cliente existente
        </button>
        <button type="button" onClick={() => setTab('new')} className={`p-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${tab === 'new' ? 'bg-primary text-white' : 'hover:bg-secondary'}`} data-testid="cp-tab-new">
          <Plus className="w-3.5 h-3.5" /> Nuevo cliente
        </button>
      </div>

      <div className="p-3">
        {tab === 'member' && (
          <>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={searchMembers} onChange={e => setSearchMembers(e.target.value)} placeholder="Buscar socio por nombre, contrato, email, DPI..." className="pl-8 rounded-lg h-9 text-xs" data-testid="cp-member-search" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredMembers.length === 0 && <p className="text-xs text-muted-foreground p-2">Sin resultados</p>}
              {filteredMembers.map(m => {
                const active = value?.type === 'member' && value.member_id === m._id;
                return (
                  <button type="button" key={m._id} onClick={() => pick({ type: 'member', member_id: m._id, name: m.name, email: m.email, phone: m.phone })}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${active ? 'bg-primary/10 border border-primary' : 'hover:bg-secondary'}`}
                    data-testid={`cp-member-${m._id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.contract_number} · {m.phone || m.email}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === 'client' && (
          <>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={searchClients} onChange={e => setSearchClients(e.target.value)} placeholder="Buscar cliente por nombre, email o teléfono..." className="pl-8 rounded-lg h-9 text-xs" data-testid="cp-client-search" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredClients.length === 0 && <p className="text-xs text-muted-foreground p-2">Sin resultados</p>}
              {filteredClients.map(c => {
                const active = value?.type === 'client' && value.client_id === c._id;
                return (
                  <button type="button" key={c._id} onClick={() => pick({ type: 'client', client_id: c._id, name: c.name, email: c.email, phone: c.phone })}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${active ? 'bg-primary/10 border border-primary' : 'hover:bg-secondary'}`}
                    data-testid={`cp-client-${c._id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.email || '-'} · {c.phone || '-'}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === 'new' && (
          <div className="space-y-2">
            <Input value={newData.name} onChange={e => updateNew('name', e.target.value)} placeholder="Nombre *" className="rounded-lg h-9" data-testid="cp-new-name" />
            <Input type="email" value={newData.email} onChange={e => updateNew('email', e.target.value)} placeholder="Email" className="rounded-lg h-9" data-testid="cp-new-email" />
            <Input value={newData.phone} onChange={e => updateNew('phone', e.target.value)} placeholder="Teléfono (para WhatsApp)" className="rounded-lg h-9" data-testid="cp-new-phone" />
            <p className="text-[11px] text-muted-foreground">Se registrará automáticamente como cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
