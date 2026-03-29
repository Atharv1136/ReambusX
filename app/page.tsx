import Link from 'next/link';

const features = [
  {
    title: 'Multi-Level Approvals',
    description: 'Define custom sequences: Manager -> Finance -> Director',
  },
  {
    title: 'OCR Receipt Scanning',
    description: 'Scan any receipt and fields auto-populate instantly',
  },
  {
    title: 'Multi-Currency Support',
    description: 'Employees submit in any currency; converted to company base',
  },
  {
    title: 'Approval Rules',
    description: 'Percentage-based, specific-approver, or hybrid conditional flows',
  },
  {
    title: 'Role Management',
    description: 'Admin, Manager, Employee roles with granular permissions',
  },
  {
    title: 'Full Audit Trail',
    description: 'Every approval action is logged with timestamps and comments',
  },
];

const howItWorks = [
  'Employee submits expense + receipt',
  'Rule engine routes to correct approver chain',
  'Each approver approves/rejects with comment',
  'Employee gets notified of final status',
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center h-9 w-9 text-2xl font-heading font-bold">
        <span className="absolute -ml-2 bg-gradient-to-br from-accent-blue to-accent-cyan bg-clip-text text-transparent">X</span>
        <span className="absolute ml-1 bg-gradient-to-br from-accent-orange to-accent-amber bg-clip-text text-transparent">X</span>
      </div>
      <span className="text-xl font-heading font-bold tracking-tight text-text-primary">
        Reambus<span className="text-accent-orange">X</span>
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.22),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.2),transparent_35%),linear-gradient(140deg,#0D1117_15%,#121A29_45%,#0D1117_100%)]" />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-bg-primary/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition hover:border-accent-blue hover:text-accent-cyan"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-accent-blue/40 bg-accent-blue/10 px-4 py-1 text-xs uppercase tracking-[0.18em] text-accent-cyan">
              Expense Management Reimagined
            </p>
            <h1 className="font-heading text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Expense Reimbursements. Automated. Transparent. Instant.
            </h1>
            <p className="mt-6 max-w-2xl text-base text-text-secondary sm:text-lg">
              ReambusX brings multi-level approval workflows, OCR receipt scanning,
              and real-time currency conversion to your company.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-orange/30 transition hover:brightness-110"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-primary transition hover:border-accent-blue hover:text-accent-cyan"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-border/80 bg-bg-card/75 p-5 shadow-lg shadow-black/20 transition hover:border-accent-blue/45"
              >
                <h2 className="font-heading text-lg text-text-primary">{feature.title}</h2>
                <p className="mt-2 text-sm text-text-secondary">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-bg-card/70 p-8">
            <h2 className="font-heading text-2xl text-text-primary">How It Works</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {howItWorks.map((step, index) => (
                <div key={step} className="rounded-xl border border-border/70 bg-bg-secondary/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-accent-cyan">Step {index + 1}</p>
                  <p className="mt-2 text-sm text-text-primary">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 bg-bg-primary/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm sm:px-6 lg:px-8">
          <Logo />
          <p className="text-text-secondary">Expense workflows made faster for modern teams.</p>
          <p className="text-text-secondary">&copy; {new Date().getFullYear()} ReambusX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
