import { NextRequest } from 'next/server';
import { handleRouteError, success } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { listRulesForCompany, createRule } from '@/lib/repositories/approval-rule-repository';
import { approvalRuleSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await requireRole(['admin']);
    const rules = await listRulesForCompany(session.companyId);
    return success({ rules });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const body = await request.json();
    const parsed = approvalRuleSchema.parse(body);

    const rule = await createRule(session.companyId, {
      name: parsed.name,
      category: parsed.category ?? null,
      minAmount: parsed.minAmount ?? null,
      maxAmount: parsed.maxAmount ?? null,
      isManagerApprover: parsed.isManagerApprover,
      minimumApprovalPercentage: parsed.minimumApprovalPercentage ?? null,
      specificApproverId: parsed.specificApproverId ?? null,
      steps: parsed.steps,
    });

    return success({ rule }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
