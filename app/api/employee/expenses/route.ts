import { NextRequest } from 'next/server';
import { handleRouteError, success } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { listExpensesForEmployee, createExpense } from '@/lib/repositories/expense-repository';
import { findMatchingRule } from '@/lib/repositories/approval-rule-repository';
import { expenseCreateSchema } from '@/lib/validators';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const session = await requireRole(['employee', 'manager', 'admin']);
    const expenses = await listExpensesForEmployee(session.id, session.companyId);
    return success({ expenses });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['employee', 'manager', 'admin']);
    const body = await request.json();
    const parsed = expenseCreateSchema.parse(body);

    // Get company currency for conversion
    const { rows: companyRows } = await pool.query<{ currency_code: string }>(
      `SELECT currency_code FROM companies WHERE id = $1`,
      [session.companyId],
    );
    const companyCurrency = companyRows[0]?.currency_code;

    // Currency conversion
    let amountInCompanyCurrency: number | null = null;
    if (companyCurrency && parsed.currencyCode !== companyCurrency) {
      try {
        const rateRes = await fetch(`https://api.exchangerate-api.com/v4/latest/${parsed.currencyCode}`);
        const rateData = await rateRes.json();
        const rate = rateData?.rates?.[companyCurrency];
        if (rate) {
          amountInCompanyCurrency = Math.round(parsed.amount * rate * 100) / 100;
        }
      } catch {
        // If conversion fails, store null
      }
    } else {
      amountInCompanyCurrency = parsed.amount;
    }

    // Find matching approval rule
    const rule = await findMatchingRule(session.companyId, parsed.category, parsed.amount);

    // Build approval steps
    const approvalSteps: { approverId: string; stepOrder: number }[] = [];
    let stepOrder = 1;

    if (rule) {
      // If manager approver is enabled and user has a manager
      if (rule.is_manager_approver && session.managerId) {
        approvalSteps.push({ approverId: session.managerId, stepOrder: stepOrder++ });
      }

      // Add rule steps
      for (const step of rule.steps) {
        // Skip if this approver is already the manager step
        if (approvalSteps.some((s) => s.approverId === step.approver_id)) continue;
        approvalSteps.push({ approverId: step.approver_id, stepOrder: stepOrder++ });
      }
    } else if (session.managerId) {
      // No rule found — default to manager approval
      approvalSteps.push({ approverId: session.managerId, stepOrder: 1 });
    }

    const expense = await createExpense(session.companyId, session.id, {
      category: parsed.category,
      description: parsed.description ?? null,
      amount: parsed.amount,
      currencyCode: parsed.currencyCode,
      amountInCompanyCurrency,
      expenseDate: parsed.expenseDate,
      receiptUrl: parsed.receiptUrl ?? null,
      ocrData: parsed.ocrData ?? null,
      ruleId: rule?.id ?? null,
      approvalSteps,
    });

    return success({ expense }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
