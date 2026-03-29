import { NextRequest } from 'next/server';
import { createCompanyWithAdmin } from '@/lib/repositories/auth-repository';
import { signupSchema } from '@/lib/validators';
import { handleRouteError, success, failure } from '@/lib/http';
import { login } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.parse(body);

    const user = await createCompanyWithAdmin({
      companyName: parsed.companyName,
      country: parsed.country,
      currencyCode: parsed.currencyCode,
      currencySymbol: parsed.currencySymbol,
      fullName: parsed.fullName,
      email: parsed.email,
      password: parsed.password,
    });

    await login(user);

    return success({
      user,
      redirectTo: '/dashboard/admin',
    }, 201);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
      return failure(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    }

    return handleRouteError(error);
  }
}
