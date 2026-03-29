import { NextRequest } from 'next/server';
import { handleRouteError, success } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { listUsersForCompany, createUser, listManagersForCompany } from '@/lib/repositories/user-repository';
import { userCreateSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await requireRole(['admin']);
    const users = await listUsersForCompany(session.companyId);
    const managers = await listManagersForCompany(session.companyId);
    return success({ users, managers });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const body = await request.json();
    const parsed = userCreateSchema.parse(body);

    const user = await createUser(session.companyId, {
      name: parsed.name,
      email: parsed.email,
      temporaryPassword: parsed.temporaryPassword,
      role: parsed.role,
      managerId: parsed.managerId ?? null,
    });

    return success({ user }, 201);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
      return (await import('@/lib/http')).failure(409, 'EMAIL_EXISTS', 'A user with this email already exists.');
    }
    return handleRouteError(error);
  }
}
