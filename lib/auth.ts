import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/constants';
import type { SessionPayload, SessionUser } from '@/lib/types';
import { signSessionToken, verifySessionToken } from '@/lib/session-token';

export async function encrypt(payload: SessionPayload) {
  return signSessionToken(payload);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  return verifySessionToken(input);
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session) return null;
  return await decrypt(session.value);
}

export async function login(user: SessionUser) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session = await encrypt({ ...user, expiresAt: expires.getTime() });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    sameSite: 'lax',
    path: '/',
  });
}
