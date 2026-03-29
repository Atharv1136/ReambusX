import { requireRole } from '@/lib/auth-guards';

export default async function ManagerTeamExpensesPage() {
  await requireRole(['manager', 'admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">Team Expenses</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Team-level filtering and full expense timeline details are being integrated.
      </p>
    </section>
  );
}
