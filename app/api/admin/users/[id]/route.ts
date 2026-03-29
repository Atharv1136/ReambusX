import { NextRequest } from 'next/server';
import { handleRouteError, success, failure } from '@/lib/http';
import { requireRole } from '@/lib/auth-guards';
import { getUserById, updateUser, deleteUser } from '@/lib/repositories/user-repository';
import { userUpdateSchema } from '@/lib/validators';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;
    const user = await getUserById(id, session.companyId);
    if (!user) return failure(404, 'NOT_FOUND', 'User not found.');
    return success({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = userUpdateSchema.parse(body);

    if (id === session.id) {
      return failure(400, 'SELF_EDIT', 'You cannot change your own role.');
    }

    const updated = await updateUser(id, session.companyId, {
      name: parsed.name,
      role: parsed.role,
      managerId: parsed.managerId,
    });

    if (!updated) return failure(404, 'NOT_FOUND', 'User not found or no changes applied.');
    return success({ updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['admin']);
    const { id } = await context.params;

    if (id === session.id) {
      return failure(400, 'SELF_DELETE', 'You cannot delete your own account.');
    }

    const deleted = await deleteUser(id, session.companyId);
    if (!deleted) return failure(404, 'NOT_FOUND', 'User not found.');
    return success({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
