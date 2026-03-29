import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getEmployeeDashboardStats, getRecentExpensesForEmployee } from '@/lib/repositories/dashboard-repository';
import Link from 'next/link';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    Travel: '✈️', Food: '🍔', 'Office Supplies': '📎', Medical: '💊', Miscellaneous: '📦',
  };
  return map[cat] ?? '📋';
}

export default async function EmployeeDashboardPage() {
  const session = await requireRole(['employee', 'manager', 'admin']);
  const [stats, expenses] = await Promise.all([
    getEmployeeDashboardStats(session.id, session.companyId),
    getRecentExpensesForEmployee(session.id, session.companyId),
  ]);

  const totalSubmitted = parseInt(stats?.total_submitted ?? '0');
  const pendingApproval = parseInt(stats?.pending_approval ?? '0');
  const approved = parseInt(stats?.approved ?? '0');
  const rejected = parseInt(stats?.rejected ?? '0');
  const approvalRate = totalSubmitted > 0 ? Math.round((approved / totalSubmitted) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="text-sm text-text-secondary">{getGreeting()},</p>
          <h1 className="font-heading text-2xl text-text-primary font-bold">
            {session.name} <span className="text-accent-cyan">✦</span>
          </h1>
        </div>
        <Link
          href="/dashboard/employee/submit"
          className="btn-shine relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110 hover:shadow-accent-orange/30"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Submit Expense
        </Link>
      </div>

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Submitted"
          value={stats?.total_submitted ?? '0'}
          accent="blue"
          delay={1}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          helper="All time"
        />
        <StatCard
          title="Pending Approval"
          value={stats?.pending_approval ?? '0'}
          accent="orange"
          delay={2}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          helper="In review"
        />
        <StatCard
          title="Approved"
          value={stats?.approved ?? '0'}
          accent="green"
          delay={3}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          helper="Successfully reimbursed"
        />
        <StatCard
          title="Rejected"
          value={stats?.rejected ?? '0'}
          accent="red"
          delay={4}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          helper="Not approved"
        />
      </section>

      {/* Approval Rate Bar */}
      {totalSubmitted > 0 && (
        <section className="glass-card rounded-2xl p-5 animate-fade-in-up anim-delay-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text-primary">Approval Rate</p>
            <p className="font-mono text-sm text-accent-cyan font-bold">{approvalRate}%</p>
          </div>
          <div className="h-2 rounded-full bg-bg-secondary/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-blue to-success transition-all duration-1000 ease-out"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-text-secondary">
            <span>{approved} approved of {totalSubmitted} submitted</span>
            <span>{pendingApproval} pending</span>
          </div>
        </section>
      )}

      {/* Recent Expenses */}
      <section className="glass-card rounded-2xl overflow-hidden animate-fade-in-up anim-delay-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-heading text-lg text-text-primary font-semibold">Recent Expenses</h2>
          <Link href="/dashboard/employee/expenses" className="text-sm text-accent-cyan hover:text-accent-blue transition-colors flex items-center gap-1">
            View All
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
        {expenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-text-secondary text-sm">No expenses yet.</p>
            <Link href="/dashboard/employee/submit" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent-orange/10 px-4 py-2 text-sm font-medium text-accent-orange hover:bg-accent-orange/20 transition-colors">
              Submit your first expense →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Category</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Amount</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Status</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, i) => (
                  <tr key={expense.id} className={`table-row-hover border-t border-border/20 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}>
                    <td className="px-6 py-3.5">
                      <span className="flex items-center gap-2">
                        <span>{getCategoryEmoji(expense.category)}</span>
                        <span className="text-text-primary font-medium">{expense.category}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-text-primary">
                      {expense.amount} <span className="text-text-secondary text-xs">{expense.currency_code}</span>
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={expense.status} /></td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
