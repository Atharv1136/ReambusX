'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  manager_id: string | null;
  manager_name: string | null;
  created_at: string;
};

type Manager = { id: string; name: string; email: string };

const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  admin: { color: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/20' },
  manager: { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  employee: { color: 'text-text-secondary', bg: 'bg-bg-secondary/60', border: 'border-border/30' },
};

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.ok) {
        setUsers(data.data.users);
        setManagers(data.data.managers);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) { setError(data.error?.message ?? 'Failed to delete.'); return; }
    showSuccess('User deleted successfully.');
    void fetchUsers();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-heading text-2xl text-text-primary font-bold">User Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? '...' : `${users.length} user${users.length !== 1 ? 's' : ''} in your organization`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-slide-in-left">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-slide-in-left">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up anim-delay-1">
        {loading ? (
          <div className="p-4"><SkeletonLoader type="table" rows={6} /></div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No users yet"
              description="Add your first team member to get started."
              action={<button onClick={() => setShowCreate(true)} className="btn-shine rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20">Add First User</button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['User', 'Email', 'Role', 'Manager', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.employee;
                  return (
                    <tr key={user.id} className={`table-row-hover border-t border-border/20 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl ${roleConfig.bg} flex items-center justify-center font-heading font-bold text-sm ${roleConfig.color}`}>
                            {user.name[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-text-primary">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary text-sm">
                        {user.manager_name ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-md bg-accent-orange/10 flex items-center justify-center text-[10px] font-bold text-accent-amber">
                              {user.manager_name[0]?.toUpperCase()}
                            </div>
                            {user.manager_name}
                          </div>
                        ) : (
                          <span className="text-text-secondary/40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditUser(user)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent-cyan border border-accent-blue/20 hover:bg-accent-blue/10 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-danger/70 border border-danger/20 hover:bg-danger/5 hover:text-danger transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} managers={managers} onCreated={() => { setShowCreate(false); showSuccess('User created successfully.'); void fetchUsers(); }} />
      {editUser && (
        <EditUserModal open={!!editUser} onClose={() => setEditUser(null)} user={editUser} managers={managers} onUpdated={() => { setEditUser(null); showSuccess('User updated.'); void fetchUsers(); }} />
      )}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-border/50 bg-bg-secondary/50 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent-blue/50 placeholder-text-secondary/40";
const labelClass = "text-xs uppercase tracking-wider text-text-secondary font-medium";

function CreateUserModal({ open, onClose, managers, onCreated }: { open: boolean; onClose: () => void; managers: Manager[]; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', temporaryPassword: '', role: 'employee', managerId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, managerId: form.managerId || null }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to create user.'); return; }
      setForm({ name: '', email: '', temporaryPassword: '', role: 'employee', managerId: '' });
      onCreated();
    } catch { setError('Unexpected error.'); } finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className={labelClass}>Full Name</span>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputClass} placeholder="Jane Doe" />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className={inputClass} placeholder="jane@company.com" />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Temporary Password</span>
          <input type="password" value={form.temporaryPassword} onChange={(e) => setForm((p) => ({ ...p, temporaryPassword: e.target.value }))} required minLength={8} className={inputClass} placeholder="Min. 8 characters" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className={labelClass}>Role</span>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputClass}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Reports To</span>
            <select value={form.managerId} onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))} className={inputClass}>
              <option value="">No Manager</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-danger flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</p>}
        <button type="submit" disabled={submitting} className="btn-shine w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
          {submitting ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Creating...</> : 'Create User'}
        </button>
      </form>
    </Modal>
  );
}

function EditUserModal({ open, onClose, user, managers, onUpdated }: { open: boolean; onClose: () => void; user: User; managers: Manager[]; onUpdated: () => void }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, managerId: user.manager_id ?? '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, role: form.role, managerId: form.managerId || null }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to update.'); return; }
      onUpdated();
    } catch { setError('Unexpected error.'); } finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className={labelClass}>Full Name</span>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className={labelClass}>Role</span>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputClass}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Reports To</span>
            <select value={form.managerId} onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))} className={inputClass}>
              <option value="">No Manager</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-danger flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</p>}
        <button type="submit" disabled={submitting} className="btn-shine w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
          {submitting ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Saving...</> : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}
