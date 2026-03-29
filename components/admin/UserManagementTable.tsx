'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';

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
    showSuccess('User deleted.');
    void fetchUsers();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">User Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
        >
          + Create User
        </button>
      </div>

      {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}
      {successMsg && <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">{successMsg}</p>}

      <div className="rounded-xl border border-border bg-bg-card shadow-lg shadow-black/20 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-text-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-border/60 hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs capitalize ${
                      user.role === 'admin' ? 'bg-accent-blue/20 text-accent-cyan border-accent-blue/40' :
                      user.role === 'manager' ? 'bg-accent-orange/20 text-accent-amber border-accent-orange/40' :
                      'bg-bg-secondary text-text-secondary border-border'
                    }`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user.manager_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditUser(user)} className="text-xs text-accent-cyan hover:text-accent-blue transition-colors">Edit</button>
                      <button onClick={() => handleDelete(user.id)} className="text-xs text-danger/80 hover:text-danger transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        managers={managers}
        onCreated={() => { setShowCreate(false); showSuccess('User created.'); void fetchUsers(); }}
      />

      {/* Edit Modal */}
      {editUser && (
        <EditUserModal
          open={!!editUser}
          onClose={() => setEditUser(null)}
          user={editUser}
          managers={managers}
          onUpdated={() => { setEditUser(null); showSuccess('User updated.'); void fetchUsers(); }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ open, onClose, managers, onCreated }: {
  open: boolean;
  onClose: () => void;
  managers: Manager[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', temporaryPassword: '', role: 'employee' as string, managerId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          managerId: form.managerId || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to create user.'); return; }
      setForm({ name: '', email: '', temporaryPassword: '', role: 'employee', managerId: '' });
      onCreated();
    } catch {
      setError('Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary">Full Name</span>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary">Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary">Temporary Password</span>
          <input type="password" value={form.temporaryPassword} onChange={(e) => setForm((p) => ({ ...p, temporaryPassword: e.target.value }))} required minLength={8} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Role</span>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Manager</span>
            <select value={form.managerId} onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
              <option value="">None</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{submitting ? 'Creating...' : 'Create User'}</button>
      </form>
    </Modal>
  );
}

function EditUserModal({ open, onClose, user, managers, onUpdated }: {
  open: boolean;
  onClose: () => void;
  user: User;
  managers: Manager[];
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({ name: user.name, role: user.role, managerId: user.manager_id ?? '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          managerId: form.managerId || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to update.'); return; }
      onUpdated();
    } catch {
      setError('Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary">Full Name</span>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Role</span>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Manager</span>
            <select value={form.managerId} onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
              <option value="">None</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-gradient-to-r from-accent-blue to-accent-cyan px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{submitting ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </Modal>
  );
}
