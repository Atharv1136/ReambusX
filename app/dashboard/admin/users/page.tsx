import { requireRole } from '@/lib/auth-guards';

export default async function AdminUsersPage() {
  await requireRole(['admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">User Management</h1>
      <p className="mt-2 text-sm text-text-secondary">
        CRUD user management UI and APIs are being implemented next in this same build pass.
      </p>
    </section>
  );
}
