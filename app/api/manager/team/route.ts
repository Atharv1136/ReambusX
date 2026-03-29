import { handleRouteError, success } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { listTeamExpenses } from '@/lib/repositories/expense-repository';

export async function GET() {
  try {
    const session = await requireRole(['manager', 'admin']);
    const expenses = await listTeamExpenses(session.id, session.companyId);
    return success({ expenses });
  } catch (error) {
    return handleRouteError(error);
  }
}
