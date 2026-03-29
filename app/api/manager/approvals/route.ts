import { handleRouteError, success } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { listPendingApprovalsForUser } from '@/lib/repositories/expense-repository';

export async function GET() {
  try {
    const session = await requireRole(['manager', 'admin']);
    const approvals = await listPendingApprovalsForUser(session.id);
    return success({ approvals });
  } catch (error) {
    return handleRouteError(error);
  }
}
