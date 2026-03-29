import { requireRole } from '@/lib/auth-guards';

export default async function AdminExpensesPage() {
  await requireRole(['admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">All Expenses</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Advanced filters, expense detail drawer, and admin override actions are being connected.
      </p>
    </section>
  );
}
