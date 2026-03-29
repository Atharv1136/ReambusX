import { NextRequest } from 'next/server';
import { handleRouteError, success, failure } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { getRuleById, updateRule, deleteRule } from '@/lib/repositories/approval-rule-repository';
import { approvalRuleSchema } from '@/lib/validators';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;
    const rule = await getRuleById(id, session.companyId);
    if (!rule) return failure(404, 'NOT_FOUND', 'Approval rule not found.');
    return success({ rule });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = approvalRuleSchema.partial().parse(body);

    const updated = await updateRule(id, session.companyId, {
      name: parsed.name,
      category: parsed.category,
      minAmount: parsed.minAmount,
      maxAmount: parsed.maxAmount,
      isManagerApprover: parsed.isManagerApprover,
      minimumApprovalPercentage: parsed.minimumApprovalPercentage,
      specificApproverId: parsed.specificApproverId,
      steps: parsed.steps,
    });

    if (!updated) return failure(404, 'NOT_FOUND', 'Approval rule not found.');
    return success({ updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;
    const deleted = await deleteRule(id, session.companyId);
    if (!deleted) return failure(404, 'NOT_FOUND', 'Approval rule not found.');
    return success({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
