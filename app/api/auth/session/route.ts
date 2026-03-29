import { getSession } from '@/lib/auth';
import { handleRouteError, success } from '@/lib/http';

export async function GET() {
  try {
    const session = await getSession();
    return success({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
