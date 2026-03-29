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

export async function getEmployeeDashboardStats(userId: string, companyId: string) {
  const { rows } = await pool.query<{
    total_submitted: string;
    pending_approval: string;
    approved: string;
    rejected: string;
  }>(
    `
      SELECT
        COUNT(*)::text AS total_submitted,
        COALESCE(SUM(CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END), 0)::text AS pending_approval,
        COALESCE(SUM(CASE WHEN e.status = 'approved' THEN 1 ELSE 0 END), 0)::text AS approved,
        COALESCE(SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END), 0)::text AS rejected
      FROM expenses e
      WHERE e.submitted_by = $1 AND e.company_id = $2
    `,
    [userId, companyId],
  );
  return rows[0];
}

export async function getRecentExpensesForEmployee(userId: string, companyId: string) {
  const { rows } = await pool.query<{
    id: string;
    category: string;
    amount: string;
    currency_code: string;
    amount_in_company_currency: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    expense_date: string;
    created_at: string;
  }>(
    `
      SELECT
        e.id, e.category,
        e.amount::text, e.currency_code,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.status, e.expense_date::text, e.created_at::text
      FROM expenses e
      WHERE e.submitted_by = $1 AND e.company_id = $2
      ORDER BY e.created_at DESC
      LIMIT 10
    `,
    [userId, companyId],
  );
  return rows;
}

export async function getManagerDashboardStats(userId: string) {
  const { rows } = await pool.query<{
    pending_my_approval: string;
    approved_by_me: string;
    rejected_by_me: string;
    total_team_expenses: string;
  }>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN ea.status = 'pending' AND ea.step_order = e.current_step AND e.status = 'pending' THEN 1 ELSE 0 END), 0)::text AS pending_my_approval,
        COALESCE(SUM(CASE WHEN ea.status = 'approved' THEN 1 ELSE 0 END), 0)::text AS approved_by_me,
        COALESCE(SUM(CASE WHEN ea.status = 'rejected' THEN 1 ELSE 0 END), 0)::text AS rejected_by_me,
        (SELECT COUNT(*)::text FROM expenses ex JOIN users u ON u.id = ex.submitted_by WHERE u.manager_id = $1)::text AS total_team_expenses
      FROM expense_approvals ea
      JOIN expenses e ON e.id = ea.expense_id
      WHERE ea.approver_id = $1
    `,
    [userId],
  );
  return rows[0];
}
