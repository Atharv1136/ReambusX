import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';

export default async function EmployeeDashboardPage() {
  await requireRole(['employee', 'manager', 'admin']);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Submitted" value="0" />
        <StatCard title="Pending Approval" value="0" />
        <StatCard title="Approved" value="0" />
        <StatCard title="Rejected" value="0" />
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="font-heading text-xl">Recent Expenses</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Submit and history panels are being connected to the workflow engine in progress.
        </p>
      </section>
    </div>
  );
}
