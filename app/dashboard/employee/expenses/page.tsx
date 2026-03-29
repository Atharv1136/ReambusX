import { requireRole } from '@/lib/auth-guards';
import ExpenseHistoryTable from '@/components/employee/ExpenseHistoryTable';

export default async function EmployeeExpensesPage() {
  await requireRole(['employee', 'manager', 'admin']);

  return <ExpenseHistoryTable />;
}
