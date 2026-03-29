import { NextRequest } from 'next/server';
import { handleRouteError, success } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { listExpensesForCompany } from '@/lib/repositories/expense-repository';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const expenses = await listExpensesForCompany(session.companyId, { status, search });
    return success({ expenses });
  } catch (error) {
    return handleRouteError(error);
  }
}
