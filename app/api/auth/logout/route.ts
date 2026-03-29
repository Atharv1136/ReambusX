import { handleRouteError, success } from '@/lib/http';
import { logout } from '@/lib/auth';

export async function POST() {
  try {
    await logout();
    return success({ loggedOut: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
