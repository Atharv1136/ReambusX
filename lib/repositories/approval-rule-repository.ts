import { pool } from '@/lib/db';

export type DbApprovalRule = {
  id: string;
  company_id: string;
  name: string;
  category: string | null;
  min_amount: string | null;
  max_amount: string | null;
  is_manager_approver: boolean;
  minimum_approval_percentage: string | null;
  specific_approver_id: string | null;
  specific_approver_name: string | null;
  created_at: string;
};

export type DbApprovalStep = {
  id: string;
  rule_id: string;
  approver_id: string;
  approver_name: string;
  approver_email: string;
  step_order: number;
  is_required: boolean;
};

export async function listRulesForCompany(companyId: string) {
  const { rows: rules } = await pool.query<DbApprovalRule>(
    `
      SELECT
        ar.id, ar.company_id, ar.name, ar.category,
        ar.min_amount::text, ar.max_amount::text,
        ar.is_manager_approver,
        ar.minimum_approval_percentage::text,
        ar.specific_approver_id,
        sa.name AS specific_approver_name,
        ar.created_at::text
      FROM approval_rules ar
      LEFT JOIN users sa ON sa.id = ar.specific_approver_id
      WHERE ar.company_id = $1
      ORDER BY ar.created_at ASC
    `,
    [companyId],
  );

  const ruleIds = rules.map((r) => r.id);
  let steps: DbApprovalStep[] = [];

  if (ruleIds.length > 0) {
    const placeholders = ruleIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query<DbApprovalStep>(
      `
        SELECT
          ars.id, ars.rule_id, ars.approver_id,
          u.name AS approver_name, u.email AS approver_email,
          ars.step_order, ars.is_required
        FROM approval_rule_steps ars
        JOIN users u ON u.id = ars.approver_id
        WHERE ars.rule_id IN (${placeholders})
        ORDER BY ars.step_order ASC
      `,
      ruleIds,
    );
    steps = rows;
  }

  return rules.map((rule) => ({
    ...rule,
    steps: steps.filter((s) => s.rule_id === rule.id),
  }));
}

export async function getRuleById(ruleId: string, companyId: string) {
  const { rows: rules } = await pool.query<DbApprovalRule>(
    `
      SELECT
        ar.id, ar.company_id, ar.name, ar.category,
        ar.min_amount::text, ar.max_amount::text,
        ar.is_manager_approver,
        ar.minimum_approval_percentage::text,
        ar.specific_approver_id,
        sa.name AS specific_approver_name,
        ar.created_at::text
      FROM approval_rules ar
      LEFT JOIN users sa ON sa.id = ar.specific_approver_id
      WHERE ar.id = $1 AND ar.company_id = $2
      LIMIT 1
    `,
    [ruleId, companyId],
  );

  if (!rules[0]) return null;

  const { rows: steps } = await pool.query<DbApprovalStep>(
    `
      SELECT
        ars.id, ars.rule_id, ars.approver_id,
        u.name AS approver_name, u.email AS approver_email,
        ars.step_order, ars.is_required
      FROM approval_rule_steps ars
      JOIN users u ON u.id = ars.approver_id
      WHERE ars.rule_id = $1
      ORDER BY ars.step_order ASC
    `,
    [ruleId],
  );

  return { ...rules[0], steps };
}

export async function createRule(
  companyId: string,
  data: {
    name: string;
    category?: string | null;
    minAmount?: number | null;
    maxAmount?: number | null;
    isManagerApprover: boolean;
    minimumApprovalPercentage?: number | null;
    specificApproverId?: string | null;
    steps: { approverId: string; stepOrder: number; isRequired: boolean }[];
  },
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO approval_rules (company_id, name, category, min_amount, max_amount, is_manager_approver, minimum_approval_percentage, specific_approver_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        companyId,
        data.name,
        data.category ?? null,
        data.minAmount ?? null,
        data.maxAmount ?? null,
        data.isManagerApprover,
        data.minimumApprovalPercentage ?? null,
        data.specificApproverId ?? null,
      ],
    );

    const ruleId = rows[0].id;

    for (const step of data.steps) {
      await client.query(
        `
          INSERT INTO approval_rule_steps (rule_id, approver_id, step_order, is_required)
          VALUES ($1, $2, $3, $4)
        `,
        [ruleId, step.approverId, step.stepOrder, step.isRequired],
      );
    }

    await client.query('COMMIT');
    return { id: ruleId };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRule(
  ruleId: string,
  companyId: string,
  data: {
    name?: string;
    category?: string | null;
    minAmount?: number | null;
    maxAmount?: number | null;
    isManagerApprover?: boolean;
    minimumApprovalPercentage?: number | null;
    specificApproverId?: string | null;
    steps?: { approverId: string; stepOrder: number; isRequired: boolean }[];
  },
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
    if (data.category !== undefined) { sets.push(`category = $${idx++}`); values.push(data.category); }
    if (data.minAmount !== undefined) { sets.push(`min_amount = $${idx++}`); values.push(data.minAmount); }
    if (data.maxAmount !== undefined) { sets.push(`max_amount = $${idx++}`); values.push(data.maxAmount); }
    if (data.isManagerApprover !== undefined) { sets.push(`is_manager_approver = $${idx++}`); values.push(data.isManagerApprover); }
    if (data.minimumApprovalPercentage !== undefined) { sets.push(`minimum_approval_percentage = $${idx++}`); values.push(data.minimumApprovalPercentage); }
    if (data.specificApproverId !== undefined) { sets.push(`specific_approver_id = $${idx++}`); values.push(data.specificApproverId); }

    if (sets.length > 0) {
      values.push(ruleId, companyId);
      await client.query(
        `UPDATE approval_rules SET ${sets.join(', ')} WHERE id = $${idx++} AND company_id = $${idx}`,
        values,
      );
    }

    if (data.steps !== undefined) {
      await client.query(`DELETE FROM approval_rule_steps WHERE rule_id = $1`, [ruleId]);
      for (const step of data.steps) {
        await client.query(
          `INSERT INTO approval_rule_steps (rule_id, approver_id, step_order, is_required) VALUES ($1, $2, $3, $4)`,
          [ruleId, step.approverId, step.stepOrder, step.isRequired],
        );
      }
    }

    await client.query('COMMIT');
    return { id: ruleId };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteRule(ruleId: string, companyId: string) {
  const { rowCount } = await pool.query(
    `DELETE FROM approval_rules WHERE id = $1 AND company_id = $2`,
    [ruleId, companyId],
  );
  return (rowCount ?? 0) > 0;
}

export async function findMatchingRule(companyId: string, category: string, amount: number) {
  const { rows } = await pool.query<DbApprovalRule>(
    `
      SELECT
        ar.id, ar.company_id, ar.name, ar.category,
        ar.min_amount::text, ar.max_amount::text,
        ar.is_manager_approver,
        ar.minimum_approval_percentage::text,
        ar.specific_approver_id,
        NULL AS specific_approver_name,
        ar.created_at::text
      FROM approval_rules ar
      WHERE ar.company_id = $1
        AND (ar.category IS NULL OR ar.category = 'All' OR ar.category = $2)
        AND (ar.min_amount IS NULL OR ar.min_amount <= $3)
        AND (ar.max_amount IS NULL OR ar.max_amount >= $3)
      ORDER BY
        CASE WHEN ar.category = $2 THEN 0 ELSE 1 END,
        ar.min_amount DESC NULLS LAST
      LIMIT 1
    `,
    [companyId, category, amount],
  );

  if (!rows[0]) return null;

  const { rows: steps } = await pool.query<DbApprovalStep>(
    `
      SELECT
        ars.id, ars.rule_id, ars.approver_id,
        u.name AS approver_name, u.email AS approver_email,
        ars.step_order, ars.is_required
      FROM approval_rule_steps ars
      JOIN users u ON u.id = ars.approver_id
      WHERE ars.rule_id = $1
      ORDER BY ars.step_order ASC
    `,
    [rows[0].id],
  );

  return { ...rows[0], steps };
}
