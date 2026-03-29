import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';

export default async function ManagerDashboardPage() {
  await requireRole(['manager', 'admin']);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending My Approval" value="0" />
        <StatCard title="Approved by Me" value="0" />
        <StatCard title="Rejected by Me" value="0" />
        <StatCard title="Total Team Expenses" value="0" />
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-5">
        <h2 className="font-heading text-xl">Approvals to Review</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Pending and completed approval queues will be fully wired in the next implementation slice.
        </p>
      </section>
    </div>
  );
}
