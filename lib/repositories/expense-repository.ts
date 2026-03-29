import { pool } from '@/lib/db';

export type DbExpense = {
  id: string;
  company_id: string;
  submitted_by: string;
  employee_name: string;
  employee_email: string;
  category: string;
  description: string | null;
  amount: string;
  currency_code: string;
  amount_in_company_currency: string | null;
  expense_date: string;
  receipt_url: string | null;
  ocr_data: Record<string, unknown> | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  current_step: number;
  rule_id: string | null;
  created_at: string;
};

export type DbExpenseApproval = {
  id: string;
  expense_id: string;
  approver_id: string;
  approver_name: string;
  approver_email: string;
  step_order: number;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  actioned_at: string | null;
  created_at: string;
};

export async function createExpense(
  companyId: string,
  userId: string,
  data: {
    category: string;
    description?: string | null;
    amount: number;
    currencyCode: string;
    amountInCompanyCurrency?: number | null;
    expenseDate: string;
    receiptUrl?: string | null;
    ocrData?: Record<string, unknown> | null;
    ruleId?: string | null;
    approvalSteps: { approverId: string; stepOrder: number }[];
  },
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const status = data.approvalSteps.length > 0 ? 'pending' : 'approved';

    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO expenses (company_id, submitted_by, category, description, amount, currency_code, amount_in_company_currency, expense_date, receipt_url, ocr_data, status, current_step, rule_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        companyId,
        userId,
        data.category,
        data.description ?? null,
        data.amount,
        data.currencyCode,
        data.amountInCompanyCurrency ?? null,
        data.expenseDate,
        data.receiptUrl ?? null,
        data.ocrData ? JSON.stringify(data.ocrData) : null,
        status,
        1,
        data.ruleId ?? null,
      ],
    );

    const expenseId = rows[0].id;

    for (const step of data.approvalSteps) {
      const stepStatus = step.stepOrder === 1 ? 'pending' : 'pending';
      await client.query(
        `
          INSERT INTO expense_approvals (expense_id, approver_id, step_order, status)
          VALUES ($1, $2, $3, $4)
        `,
        [expenseId, step.approverId, step.stepOrder, stepStatus],
      );
    }

    await client.query('COMMIT');
    return { id: expenseId, status };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function listExpensesForEmployee(userId: string, companyId: string) {
  const { rows } = await pool.query<DbExpense>(
    `
      SELECT
        e.id, e.company_id, e.submitted_by,
        u.name AS employee_name, u.email AS employee_email,
        e.category, e.description,
        e.amount::text, e.currency_code,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.expense_date::text, e.receipt_url, e.ocr_data,
        e.status, e.current_step, e.rule_id,
        e.created_at::text
      FROM expenses e
      JOIN users u ON u.id = e.submitted_by
      WHERE e.submitted_by = $1 AND e.company_id = $2
      ORDER BY e.created_at DESC
    `,
    [userId, companyId],
  );
  return rows;
}

export async function listExpensesForCompany(
  companyId: string,
  filters?: { status?: string; search?: string },
) {
  let whereClause = 'WHERE e.company_id = $1';
  const params: unknown[] = [companyId];
  let idx = 2;

  if (filters?.status && filters.status !== 'all') {
    whereClause += ` AND e.status = $${idx++}`;
    params.push(filters.status);
  }

  if (filters?.search) {
    whereClause += ` AND (u.name ILIKE $${idx} OR e.category ILIKE $${idx} OR e.description ILIKE $${idx})`;
    params.push(`%${filters.search}%`);
    idx++;
  }

  const { rows } = await pool.query<DbExpense>(
    `
      SELECT
        e.id, e.company_id, e.submitted_by,
        u.name AS employee_name, u.email AS employee_email,
        e.category, e.description,
        e.amount::text, e.currency_code,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.expense_date::text, e.receipt_url, e.ocr_data,
        e.status, e.current_step, e.rule_id,
        e.created_at::text
      FROM expenses e
      JOIN users u ON u.id = e.submitted_by
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT 200
    `,
    params,
  );
  return rows;
}

export async function listPendingApprovalsForUser(userId: string) {
  const { rows } = await pool.query<
    DbExpense & { approval_id: string; approval_step_order: number }
  >(
    `
      SELECT
        e.id, e.company_id, e.submitted_by,
        u.name AS employee_name, u.email AS employee_email,
        e.category, e.description,
        e.amount::text, e.currency_code,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.expense_date::text, e.receipt_url, e.ocr_data,
        e.status, e.current_step, e.rule_id,
        e.created_at::text,
        ea.id AS approval_id,
        ea.step_order AS approval_step_order
      FROM expense_approvals ea
      JOIN expenses e ON e.id = ea.expense_id
      JOIN users u ON u.id = e.submitted_by
      WHERE ea.approver_id = $1
        AND ea.status = 'pending'
        AND ea.step_order = e.current_step
        AND e.status = 'pending'
      ORDER BY e.created_at ASC
    `,
    [userId],
  );
  return rows;
}

export async function listTeamExpenses(managerId: string, companyId: string) {
  const { rows } = await pool.query<DbExpense>(
    `
      SELECT
        e.id, e.company_id, e.submitted_by,
        u.name AS employee_name, u.email AS employee_email,
        e.category, e.description,
        e.amount::text, e.currency_code,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.expense_date::text, e.receipt_url, e.ocr_data,
        e.status, e.current_step, e.rule_id,
        e.created_at::text
      FROM expenses e
      JOIN users u ON u.id = e.submitted_by
      WHERE u.manager_id = $1 AND e.company_id = $2
      ORDER BY e.created_at DESC
      LIMIT 200
    `,
    [managerId, companyId],
  );
  return rows;
}

export async function getExpenseWithApprovals(expenseId: string, companyId: string) {
  const { rows: expenses } = await pool.query<DbExpense>(
    `
      SELECT
        e.id, e.company_id, e.submitted_by,
        u.name AS employee_name, u.email AS employee_email,
        e.category, e.description,
        e.amount::text, e.currency_code,
        COALESCE(e.amount_in_company_currency, 0)::text AS amount_in_company_currency,
        e.expense_date::text, e.receipt_url, e.ocr_data,
        e.status, e.current_step, e.rule_id,
        e.created_at::text
      FROM expenses e
      JOIN users u ON u.id = e.submitted_by
      WHERE e.id = $1 AND e.company_id = $2
      LIMIT 1
    `,
    [expenseId, companyId],
  );

  if (!expenses[0]) return null;

  const { rows: approvals } = await pool.query<DbExpenseApproval>(
    `
      SELECT
        ea.id, ea.expense_id, ea.approver_id,
        u.name AS approver_name, u.email AS approver_email,
        ea.step_order, ea.status, ea.comment,
        ea.actioned_at::text,
        ea.created_at::text
      FROM expense_approvals ea
      JOIN users u ON u.id = ea.approver_id
      WHERE ea.expense_id = $1
      ORDER BY ea.step_order ASC
    `,
    [expenseId],
  );

  return { ...expenses[0], approvals };
}

export async function approveExpenseStep(approvalId: string, userId: string, comment?: string | null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Mark this approval step as approved
    const { rows: approvalRows } = await client.query<{ expense_id: string; step_order: number }>(
      `
        UPDATE expense_approvals
        SET status = 'approved', comment = $1, actioned_at = NOW()
        WHERE id = $2 AND approver_id = $3 AND status = 'pending'
        RETURNING expense_id, step_order
      `,
      [comment ?? null, approvalId, userId],
    );

    if (!approvalRows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const { expense_id: expenseId, step_order: currentStep } = approvalRows[0];

    // Get expense with its rule for conditional checks
    const { rows: expenseRows } = await client.query<{
      rule_id: string | null;
    }>(`SELECT rule_id FROM expenses WHERE id = $1`, [expenseId]);

    const ruleId = expenseRows[0]?.rule_id;

    // Check conditional approval rules
    let autoApprove = false;

    if (ruleId) {
      const { rows: ruleRows } = await client.query<{
        minimum_approval_percentage: string | null;
        specific_approver_id: string | null;
      }>(`SELECT minimum_approval_percentage, specific_approver_id FROM approval_rules WHERE id = $1`, [ruleId]);

      const rule = ruleRows[0];

      if (rule) {
        // Check specific approver rule
        if (rule.specific_approver_id && rule.specific_approver_id === userId) {
          autoApprove = true;
        }

        // Check percentage rule
        if (rule.minimum_approval_percentage) {
          const { rows: countRows } = await client.query<{ total: string; approved: string }>(
            `
              SELECT
                COUNT(*)::text AS total,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::text AS approved
              FROM expense_approvals
              WHERE expense_id = $1
            `,
            [expenseId],
          );

          const total = parseInt(countRows[0].total, 10);
          const approved = parseInt(countRows[0].approved, 10);
          const percentage = (approved / total) * 100;

          if (percentage >= parseFloat(rule.minimum_approval_percentage)) {
            autoApprove = true;
          }
        }
      }
    }

    if (autoApprove) {
      // Auto-approve remaining steps and the expense
      await client.query(
        `UPDATE expense_approvals SET status = 'approved', actioned_at = NOW() WHERE expense_id = $1 AND status = 'pending'`,
        [expenseId],
      );
      await client.query(
        `UPDATE expenses SET status = 'approved' WHERE id = $1`,
        [expenseId],
      );
    } else {
      // Check if there's a next step
      const { rows: nextSteps } = await client.query<{ step_order: number }>(
        `
          SELECT step_order FROM expense_approvals
          WHERE expense_id = $1 AND step_order > $2
          ORDER BY step_order ASC
          LIMIT 1
        `,
        [expenseId, currentStep],
      );

      if (nextSteps[0]) {
        await client.query(
          `UPDATE expenses SET current_step = $1 WHERE id = $2`,
          [nextSteps[0].step_order, expenseId],
        );
      } else {
        // Last step — approve expense
        await client.query(
          `UPDATE expenses SET status = 'approved' WHERE id = $1`,
          [expenseId],
        );
      }
    }

    await client.query('COMMIT');
    return { expenseId };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectExpenseStep(approvalId: string, userId: string, comment?: string | null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ expense_id: string }>(
      `
        UPDATE expense_approvals
        SET status = 'rejected', comment = $1, actioned_at = NOW()
        WHERE id = $2 AND approver_id = $3 AND status = 'pending'
        RETURNING expense_id
      `,
      [comment ?? null, approvalId, userId],
    );

    if (!rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    // Reject the expense and cancel remaining approvals
    await client.query(
      `UPDATE expenses SET status = 'rejected' WHERE id = $1`,
      [rows[0].expense_id],
    );

    await client.query(
      `UPDATE expense_approvals SET status = 'rejected', actioned_at = NOW() WHERE expense_id = $1 AND status = 'pending'`,
      [rows[0].expense_id],
    );

    await client.query('COMMIT');
    return { expenseId: rows[0].expense_id };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function adminOverrideExpense(
  expenseId: string,
  companyId: string,
  status: 'approved' | 'rejected',
  comment?: string | null,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rowCount } = await client.query(
      `UPDATE expenses SET status = $1 WHERE id = $2 AND company_id = $3`,
      [status, expenseId, companyId],
    );

    if (!rowCount || rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    // Mark all pending approvals as the override status
    await client.query(
      `UPDATE expense_approvals SET status = $1, comment = $2, actioned_at = NOW() WHERE expense_id = $3 AND status = 'pending'`,
      [status, comment ? `[Admin Override] ${comment}` : '[Admin Override]', expenseId],
    );

    await client.query('COMMIT');
    return { expenseId };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
