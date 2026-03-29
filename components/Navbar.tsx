import Link from 'next/link';
import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Navbar() {
  const session = await getSession();

  // Handle server-only logout
  // Note: we'll use a client component or a form action for the real logout to be cleaner,
  // but let's build the visual layout directly here.
  
  const homeHref = session
    ? session.role === 'admin'
      ? '/dashboard/admin'
      : session.role === 'manager'
        ? '/dashboard/manager'
        : '/dashboard/employee'
    : '/';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={homeHref} className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center w-8 h-8 font-heading font-bold text-2xl tracking-tighter shadow-sm">
                <span className="bg-gradient-to-br from-accent-blue to-accent-cyan bg-clip-text text-transparent transform group-hover:-translate-x-0.5 transition-transform absolute -ml-2">X</span>
                <span className="bg-gradient-to-br from-accent-orange to-accent-amber bg-clip-text text-transparent transform group-hover:translate-x-0.5 transition-transform absolute ml-1">X</span>
              </div>
              <span className="text-xl font-heading font-bold tracking-tight text-text-primary hidden sm:block">
                Reambus<span className="text-accent-orange">X</span>
              </span>
            </Link>

            {/* Role Nav Links */}
            {session && (
              <div className="hidden md:block">
                <div className="flex items-baseline space-x-4 text-sm font-medium text-text-secondary">
                  {session.role === 'admin' && (
                    <>
                      <Link href="/dashboard/admin" className="hover:text-text-primary transition-colors">Dashboard</Link>
                      <Link href="/dashboard/admin/users" className="hover:text-text-primary transition-colors">Users</Link>
                      <Link href="/dashboard/admin/approval-rules" className="hover:text-text-primary transition-colors">Approval Rules</Link>
                      <Link href="/dashboard/admin/expenses" className="hover:text-text-primary transition-colors">All Expenses</Link>
                    </>
                  )}
                  {session.role === 'manager' && (
                    <>
                      <Link href="/dashboard/manager" className="hover:text-text-primary transition-colors">Dashboard</Link>
                      <Link href="/dashboard/manager/approvals" className="hover:text-text-primary transition-colors">My Approvals</Link>
                      <Link href="/dashboard/manager/team" className="hover:text-text-primary transition-colors">Team Expenses</Link>
                    </>
                  )}
                  {session.role === 'employee' && (
                    <>
                      <Link href="/dashboard/employee" className="hover:text-text-primary transition-colors">Dashboard</Link>
                      <Link href="/dashboard/employee/expenses" className="hover:text-text-primary transition-colors">My Expenses</Link>
                      <Link href="/dashboard/employee/submit" className="text-accent-blue hover:text-accent-cyan transition-colors">Submit Expense</Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!session ? (
              <>
                <Link href="/login" className="text-sm font-medium text-text-primary hover:text-accent-blue transition-colors">
                  Log In
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-gradient-to-r from-accent-orange to-accent-amber text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all shadow-md">
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-text-primary leading-tight">{session.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{session.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center font-heading font-bold text-accent-cyan">
                  {session.name?.[0]?.toUpperCase() || 'U'}
                </div>
                {/* Logout Button (Ideally this would be a Client Component with onClick router.refresh, but for now we link to an API route that forces logout) */}
                <form action={async () => {
                  'use server';
                  await logout();
                  redirect('/login');
                }}>
                  <button type="submit" className="text-sm text-text-secondary hover:text-danger ml-2">
                    Logout
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
