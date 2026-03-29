import { SignJWT, jwtVerify } from 'jose';
import { DEFAULT_JWT_EXPIRES_IN } from '@/lib/constants';
import type { SessionPayload } from '@/lib/types';

const secretKey = process.env.JWT_SECRET || 'reambus-super-secret-jwt-key';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;
const key = new TextEncoder().encode(secretKey);

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(jwtExpiresIn)
    .sign(key);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    return payload as SessionPayload;
  } catch {
    return null;
  }
}
