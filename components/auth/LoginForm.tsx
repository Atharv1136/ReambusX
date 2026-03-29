'use client';

import Link from 'next/link';
import { useState } from 'react';

type LoginState = {
  email: string;
  password: string;
};

const initialState: LoginState = {
  email: '',
  password: '',
};

export default function LoginForm() {
  const [formState, setFormState] = useState<LoginState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.error?.message ?? 'Unable to log in.');
        return;
      }

      window.location.href = payload.data.redirectTo ?? '/dashboard/employee';
    } catch {
      setError('Unexpected error while logging in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden border-r border-border bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.26),transparent_38%),radial-gradient(circle_at_78%_70%,rgba(245,158,11,0.22),transparent_35%),linear-gradient(155deg,#0D1117,#161F31)] p-12 lg:block">
        <p className="inline-flex rounded-full border border-accent-orange/40 bg-accent-orange/10 px-4 py-1 text-xs uppercase tracking-[0.18em] text-accent-amber">
          AntiGravity Stack
        </p>
        <h1 className="mt-8 max-w-md font-heading text-4xl leading-tight text-white">
          Approvals, policy control, and reimbursement clarity in one place.
        </h1>
        <p className="mt-5 max-w-md text-text-secondary">
          ReambusX keeps expenses moving with real-time tracking across employees, managers, and finance.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-bg-card/80 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <h2 className="font-heading text-3xl text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-text-secondary">Log in to continue to your workspace.</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Email</span>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Password</span>
              <input
                type="password"
                required
                value={formState.password}
                onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-sm text-text-secondary">
            <p>
              Forgot password? <span className="text-accent-cyan">Contact your admin.</span>
            </p>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-accent-cyan hover:text-accent-blue">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
