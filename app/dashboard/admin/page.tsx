import { format } from 'date-fns';
import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getAdminDashboardStats, getRecentExpensesForAdmin } from '@/lib/repositories/dashboard-repository';
import Link from 'next/link';

function TrendingUpIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function XCircleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function QuickActionCard({ href, title, description, gradient, icon }: {
  href: string; title: string; description: string; gradient: string; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative glass-card rounded-2xl p-5 overflow-hidden flex items-start gap-4"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient}`}>
        {icon}
      </div>
      <div>
        <p className="font-heading font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/40 group-hover:text-accent-blue group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function AdminDashboardPage() {
  const session = await requireRole(['admin']);
  const [stats, expenses] = await Promise.all([
    getAdminDashboardStats(session.companyId),
    getRecentExpensesForAdmin(session.companyId),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="text-sm text-text-secondary">{getGreeting()},</p>
          <h1 className="font-heading text-2xl text-text-primary font-bold">
            {session.name} <span className="text-accent-orange">✦</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border/50 bg-bg-secondary/50 px-3 py-2 text-xs text-text-secondary">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-dot-pulse" />
            System Operational
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Spend This Month"
          value={stats?.total_expenses_month ?? '0'}
          accent="blue"
          delay={1}
          icon={<TrendingUpIcon />}
          helper="Company-wide total"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending_approvals ?? '0'}
          accent="orange"
          delay={2}
          icon={<ClockIcon />}
          helper="Awaiting review"
        />
        <StatCard
          title="Approved This Month"
          value={stats?.approved_month ?? '0'}
          accent="green"
          delay={3}
          icon={<CheckCircleIcon />}
          helper="Successfully processed"
        />
        <StatCard
          title="Rejected This Month"
          value={stats?.rejected_month ?? '0'}
          accent="red"
          delay={4}
          icon={<XCircleIcon />}
          helper="Declined or overridden"
        />
      </section>

      {/* Quick Actions */}
      <section className="animate-fade-in-up anim-delay-4">
        <h2 className="font-heading text-sm uppercase tracking-widest text-text-secondary mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            href="/dashboard/admin/users"
            title="Manage Users"
            description="Add / edit team members"
            gradient="bg-accent-blue/10 text-accent-blue"
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <QuickActionCard
            href="/dashboard/admin/approval-rules"
            title="Approval Rules"
            description="Configure multi-step flows"
            gradient="bg-accent-orange/10 text-accent-orange"
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          />
          <QuickActionCard
            href="/dashboard/admin/expenses"
            title="All Expenses"
            description="Review & override expenses"
            gradient="bg-success/10 text-success"
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          />
          <QuickActionCard
            href="/dashboard/admin/settings"
            title="Settings"
            description="Company & currency setup"
            gradient="bg-accent-purple/10 text-accent-purple"
            icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>}
          />
        </div>
      </section>

      {/* Recent Expenses Table */}
      <section className="glass-card rounded-2xl overflow-hidden animate-fade-in-up anim-delay-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-heading text-lg text-text-primary font-semibold">Recent Expenses</h2>
          <Link href="/dashboard/admin/expenses" className="text-sm text-accent-cyan hover:text-accent-blue transition-colors flex items-center gap-1">
            View All
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Employee</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Category</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Amount</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Status</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, i) => (
                <tr
                  key={expense.id}
                  className={`table-row-hover border-t border-border/20 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}
                >
                  <td className="px-6 py-3.5 font-medium text-text-primary">{expense.employee_name}</td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-lg bg-bg-secondary/60 px-2 py-0.5 text-xs text-text-secondary">{expense.category}</span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-text-primary">{expense.amount_in_company_currency}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={expense.status} /></td>
                  <td className="px-6 py-3.5 text-text-secondary text-xs">
                    {format(new Date(expense.created_at), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-text-secondary" colSpan={5}>
                    No expenses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
