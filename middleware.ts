import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/lib/constants';
import { verifySessionToken } from '@/lib/session-token';

const publicApiRoutes = new Set([
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/countries',
  '/api/exchange-rate',
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith('/api')) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Please log in to continue.',
          },
        },
        { status: 401 },
      );
    }

    if (!hasPathAccess(pathname, session.role)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission for this action.',
          },
        },
        { status: 403 },
      );
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasPathAccess(pathname, session.role)) {
      const redirectTo = getHomeByRole(session.role);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

function isPublicApi(pathname: string) {
  if (publicApiRoutes.has(pathname)) return true;
  return pathname.startsWith('/api/exchange-rate/');
}

function hasPathAccess(pathname: string, role: string) {
  if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/api/admin')) {
    return role === 'admin';
  }

  if (pathname.startsWith('/dashboard/manager') || pathname.startsWith('/api/manager')) {
    return role === 'manager' || role === 'admin';
  }

  if (pathname.startsWith('/dashboard/employee') || pathname.startsWith('/api/employee')) {
    return role === 'employee' || role === 'manager' || role === 'admin';
  }

  return true;
}

function getHomeByRole(role: string) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'manager') return '/dashboard/manager';
  return '/dashboard/employee';
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
