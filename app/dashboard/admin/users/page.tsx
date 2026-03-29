import { requireRole } from '@/lib/auth-guards';
import UserManagementTable from '@/components/admin/UserManagementTable';

export default async function AdminUsersPage() {
  await requireRole(['admin']);

  return <UserManagementTable />;
}
