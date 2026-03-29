import { requireRole } from '@/lib/auth-guards';

export default async function AdminApprovalRulesPage() {
  await requireRole(['admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">Approval Rules</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Sequence builder, manager-first toggle, and conditional approval logic UI are in active implementation.
      </p>
    </section>
  );
}
