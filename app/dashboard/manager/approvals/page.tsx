import { requireRole } from '@/lib/auth-guards';
import ApprovalQueue from '@/components/manager/ApprovalQueue';

export default async function ManagerApprovalsPage() {
  await requireRole(['manager', 'admin']);

  return <ApprovalQueue />;
}
