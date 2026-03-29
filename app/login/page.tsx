import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { getSession } from '@/lib/auth';

export default async function LoginPage() {
  const session = await getSession();

  if (session?.role === 'admin') redirect('/dashboard/admin');
  if (session?.role === 'manager') redirect('/dashboard/manager');
  if (session?.role === 'employee') redirect('/dashboard/employee');

  return <LoginForm />;
}
