import { NextRequest } from 'next/server';
import { handleRouteError, success, failure } from '@/lib/http';
import { findUserByEmail, toSessionUser, verifyPassword } from '@/lib/repositories/auth-repository';
import { loginSchema } from '@/lib/validators';
import { login } from '@/lib/auth';

const roleRedirectMap: Record<string, string> = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  employee: '/dashboard/employee',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);

    const user = await findUserByEmail(parsed.email);
    if (!user) {
      return failure(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const validPassword = await verifyPassword(parsed.password, user.password_hash);
    if (!validPassword) {
      return failure(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const sessionUser = toSessionUser(user);
    await login(sessionUser);

    return success({
      user: sessionUser,
      redirectTo: roleRedirectMap[user.role] ?? '/dashboard/employee',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
