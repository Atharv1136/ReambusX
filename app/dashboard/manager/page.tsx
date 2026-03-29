import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';
import { getManagerDashboardStats } from '@/lib/repositories/dashboard-repository';
import Link from 'next/link';

export default async function ManagerDashboardPage() {
  const session = await requireRole(['manager', 'admin']);
  const stats = await getManagerDashboardStats(session.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">Manager Dashboard</h1>
        <Link
          href="/dashboard/manager/approvals"
          className="rounded-lg bg-gradient-to-r from-accent-blue to-accent-cyan px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110"
        >
          View Approvals
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending My Approval" value={stats?.pending_my_approval ?? '0'} />
        <StatCard title="Approved by Me" value={stats?.approved_by_me ?? '0'} />
        <StatCard title="Rejected by Me" value={stats?.rejected_by_me ?? '0'} />
        <StatCard title="Total Team Expenses" value={stats?.total_team_expenses ?? '0'} />
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/20">
        <h2 className="font-heading text-xl text-text-primary mb-2">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link
            href="/dashboard/manager/approvals"
            className="rounded-lg border border-border bg-bg-secondary p-4 hover:border-accent-blue/50 transition-colors"
          >
            <p className="text-sm font-medium text-text-primary">My Approvals</p>
            <p className="text-xs text-text-secondary mt-1">Review and act on pending expenses</p>
          </Link>
          <Link
            href="/dashboard/manager/team"
            className="rounded-lg border border-border bg-bg-secondary p-4 hover:border-accent-orange/50 transition-colors"
          >
            <p className="text-sm font-medium text-text-primary">Team Expenses</p>
            <p className="text-xs text-text-secondary mt-1">View all expenses from your direct reports</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
