import { pool } from '@/lib/db';

export async function getAdminDashboardStats(companyId: string) {
  const { rows } = await pool.query<{
    total_expenses_month: string;
    pending_approvals: string;
    approved_month: string;
    rejected_month: string;
  }>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN date_trunc('month', e.created_at) = date_trunc('month', now()) THEN e.amount_in_company_currency ELSE 0 END), 0)::text AS total_expenses_month,
        COALESCE(SUM(CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END), 0)::text AS pending_approvals,
        COALESCE(SUM(CASE WHEN e.status = 'approved' AND date_trunc('month', e.created_at) = date_trunc('month', now()) THEN 1 ELSE 0 END), 0)::text AS approved_month,
        COALESCE(SUM(CASE WHEN e.status = 'rejected' AND date_trunc('month', e.created_at) = date_trunc('month', now()) THEN 1 ELSE 0 END), 0)::text AS rejected_month
      FROM expenses e
      WHERE e.company_id = $1
    `,
    [companyId],
  );

  return rows[0];
}

export async function getRecentExpensesForAdmin(companyId: string) {
  const { rows } = await pool.query<{
    id: string;
    employee_name: string;
    category: string;
    amount_in_company_currency: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    created_at: string;
  }>(
    `
      SELECT
        e.id,
        u.name AS employee_name,
        e.category,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.status,
        e.created_at::text
      FROM expenses e
      JOIN users u ON u.id = e.submitted_by
      WHERE e.company_id = $1
      ORDER BY e.created_at DESC
      LIMIT 10
    `,
    [companyId],
  );

  return rows;
}
