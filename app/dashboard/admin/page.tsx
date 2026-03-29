import { format } from 'date-fns';
import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getAdminDashboardStats, getRecentExpensesForAdmin } from '@/lib/repositories/dashboard-repository';

export default async function AdminDashboardPage() {
  const session = await requireRole(['admin']);
  const [stats, expenses] = await Promise.all([
    getAdminDashboardStats(session.companyId),
    getRecentExpensesForAdmin(session.companyId),
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Expenses This Month" value={stats?.total_expenses_month ?? '0'} />
        <StatCard title="Pending Approvals" value={stats?.pending_approvals ?? '0'} />
        <StatCard title="Approved This Month" value={stats?.approved_month ?? '0'} />
        <StatCard title="Rejected This Month" value={stats?.rejected_month ?? '0'} />
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-text-primary">Recent Expenses</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-border/70 text-text-primary">
                  <td className="px-3 py-3">{expense.employee_name}</td>
                  <td className="px-3 py-3">{expense.category}</td>
                  <td className="px-3 py-3 font-mono">{expense.amount_in_company_currency}</td>
                  <td className="px-3 py-3"><StatusBadge status={expense.status} /></td>
                  <td className="px-3 py-3 text-text-secondary">
                    {format(new Date(expense.created_at), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-text-secondary" colSpan={5}>
                    No expenses yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
