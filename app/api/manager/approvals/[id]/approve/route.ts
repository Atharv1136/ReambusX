import { NextRequest } from 'next/server';
import { handleRouteError, success, failure } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { approveExpenseStep } from '@/lib/repositories/expense-repository';
import { expenseActionSchema } from '@/lib/validators';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['manager', 'admin']);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = expenseActionSchema.parse(body);

    const result = await approveExpenseStep(id, session.id, parsed.comment);
    if (!result) return failure(404, 'NOT_FOUND', 'Approval not found or already actioned.');
    return success({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}
