import { NextRequest } from 'next/server';
import { handleRouteError, success, failure } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { adminOverrideExpense } from '@/lib/repositories/expense-repository';
import { adminOverrideSchema } from '@/lib/validators';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminOverrideSchema.parse(body);

    const result = await adminOverrideExpense(id, session.companyId, parsed.status, parsed.comment);
    if (!result) return failure(404, 'NOT_FOUND', 'Expense not found.');
    return success({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}
