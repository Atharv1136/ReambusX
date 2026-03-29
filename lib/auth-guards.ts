import { AppError } from '@/lib/http';
import { getSession } from '@/lib/auth';
import type { Role, SessionPayload } from '@/lib/types';

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
  }

  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = (await requireSession()) as SessionPayload;

  if (!allowedRoles.includes(session.role)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission for this action.');
  }

  return session;
}
