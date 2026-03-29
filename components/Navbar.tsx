import Link from 'next/link';
import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Navbar() {
  const session = await getSession();

  const homeHref = session
    ? session.role === 'admin'
      ? '/dashboard/admin'
      : session.role === 'manager'
        ? '/dashboard/manager'
        : '/dashboard/employee'
    : '/';

  const navLinks = session?.role === 'admin'
    ? [
        { href: '/dashboard/admin', label: 'Dashboard' },
        { href: '/dashboard/admin/users', label: 'Users' },
        { href: '/dashboard/admin/approval-rules', label: 'Approval Rules' },
        { href: '/dashboard/admin/expenses', label: 'All Expenses' },
      ]
    : session?.role === 'manager'
    ? [
        { href: '/dashboard/manager', label: 'Dashboard' },
        { href: '/dashboard/manager/approvals', label: 'My Approvals' },
        { href: '/dashboard/manager/team', label: 'Team Expenses' },
      ]
    : session?.role === 'employee'
    ? [
        { href: '/dashboard/employee', label: 'Dashboard' },
        { href: '/dashboard/employee/expenses', label: 'My Expenses' },
        { href: '/dashboard/employee/submit', label: 'Submit Expense' },
      ]
    : [];

  const avatarGradient = session?.role === 'admin'
    ? 'from-accent-purple/30 to-accent-blue/30 text-accent-cyan'
    : session?.role === 'manager'
    ? 'from-accent-orange/30 to-accent-amber/30 text-accent-amber'
    : 'from-accent-blue/30 to-accent-cyan/30 text-accent-cyan';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-bg-primary/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href={homeHref} className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center w-8 h-8 font-heading font-bold text-2xl tracking-tighter">
                <span className="bg-gradient-to-br from-accent-blue to-accent-cyan bg-clip-text text-transparent transform group-hover:-translate-x-0.5 transition-transform duration-300 absolute -ml-2">X</span>
                <span className="bg-gradient-to-br from-accent-orange to-accent-amber bg-clip-text text-transparent transform group-hover:translate-x-0.5 transition-transform duration-300 absolute ml-1">X</span>
              </div>
              <span className="text-xl font-heading font-bold tracking-tight text-text-primary hidden sm:block">
                Reambus<span className="text-accent-orange">X</span>
              </span>
            </Link>

            {/* Navigation Links */}
            {session && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-secondary/60 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {!session ? (
              <>
                <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-secondary/60">
                  Log In
                </Link>
                <Link href="/signup" className="btn-shine text-sm font-semibold bg-gradient-to-r from-accent-orange to-accent-amber text-white px-4 py-2 rounded-xl hover:brightness-110 transition-all shadow-md shadow-accent-orange/20">
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-text-primary leading-tight">{session.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{session.role}</p>
                </div>
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${avatarGradient} border border-border/50 flex items-center justify-center font-heading font-bold text-sm`}>
                  {session.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <form action={async () => {
                  'use server';
                  await logout();
                  redirect('/login');
                }}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-danger hover:bg-danger/5 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
