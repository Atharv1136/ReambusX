import { requireRole } from '@/lib/auth-guards';
import { pool } from '@/lib/db';
import SubmitExpenseForm from '@/components/employee/SubmitExpenseForm';

export default async function SubmitExpensePage() {
  const session = await requireRole(['employee', 'manager', 'admin']);

  const { rows } = await pool.query<{ currency_code: string }>(
    `SELECT currency_code FROM companies WHERE id = $1`,
    [session.companyId],
  );
  const companyCurrency = rows[0]?.currency_code ?? 'USD';

  return <SubmitExpenseForm companyCurrency={companyCurrency} />;
}
