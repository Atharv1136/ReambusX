import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getEmployeeDashboardStats, getRecentExpensesForEmployee } from '@/lib/repositories/dashboard-repository';
import Link from 'next/link';

export default async function EmployeeDashboardPage() {
  const session = await requireRole(['employee', 'manager', 'admin']);
  const [stats, expenses] = await Promise.all([
    getEmployeeDashboardStats(session.id, session.companyId),
    getRecentExpensesForEmployee(session.id, session.companyId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">Welcome, {session.name}</h1>
        <Link
          href="/dashboard/employee/submit"
          className="rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
        >
          + Submit Expense
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Submitted" value={stats?.total_submitted ?? '0'} />
        <StatCard title="Pending Approval" value={stats?.pending_approval ?? '0'} />
        <StatCard title="Approved" value={stats?.approved ?? '0'} />
        <StatCard title="Rejected" value={stats?.rejected ?? '0'} />
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-text-primary">Recent Expenses</h2>
          <Link href="/dashboard/employee/expenses" className="text-sm text-accent-cyan hover:text-accent-blue transition-colors">View All →</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-border/70 text-text-primary">
                  <td className="px-3 py-3">{expense.category}</td>
                  <td className="px-3 py-3 font-mono">{expense.amount} {expense.currency_code}</td>
                  <td className="px-3 py-3"><StatusBadge status={expense.status} /></td>
                  <td className="px-3 py-3 text-text-secondary">
                    {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-text-secondary" colSpan={4}>
                    No expenses yet. Submit your first expense to get started.
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
