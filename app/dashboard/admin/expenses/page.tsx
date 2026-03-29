import { requireRole } from '@/lib/auth-guards';
import AdminExpenseTable from '@/components/admin/AdminExpenseTable';

export default async function AdminExpensesPage() {
  await requireRole(['admin']);

  return <AdminExpenseTable />;
}
