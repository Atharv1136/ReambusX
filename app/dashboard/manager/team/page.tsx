import { requireRole } from '@/lib/auth-guards';
import TeamExpenseTable from '@/components/manager/TeamExpenseTable';

export default async function ManagerTeamExpensesPage() {
  await requireRole(['manager', 'admin']);

  return <TeamExpenseTable />;
}
