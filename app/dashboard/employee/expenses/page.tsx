import { requireRole } from '@/lib/auth-guards';

export default async function EmployeeExpensesPage() {
  await requireRole(['employee', 'manager', 'admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">My Expenses</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Expense filters and approval timeline stepper are in active implementation.
      </p>
    </section>
  );
}
