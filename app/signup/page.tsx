import { redirect } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';
import { getSession } from '@/lib/auth';

export default async function SignupPage() {
  const session = await getSession();

  if (session?.role === 'admin') redirect('/dashboard/admin');
  if (session?.role === 'manager') redirect('/dashboard/manager');
  if (session?.role === 'employee') redirect('/dashboard/employee');

  return <SignupForm />;
}
