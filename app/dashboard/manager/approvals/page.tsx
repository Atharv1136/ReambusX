import { requireRole } from '@/lib/auth-guards';

export default async function ManagerApprovalsPage() {
  await requireRole(['manager', 'admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">My Approvals</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Approve/reject action modals and pending/completed tabs are in progress.
      </p>
    </section>
  );
}
