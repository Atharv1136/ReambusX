import { requireRole } from '@/lib/auth-guards';
import ApprovalRuleBuilder from '@/components/admin/ApprovalRuleBuilder';

export default async function AdminApprovalRulesPage() {
  await requireRole(['admin']);

  return <ApprovalRuleBuilder />;
}
