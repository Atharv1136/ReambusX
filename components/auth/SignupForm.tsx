'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type CountryOption = {
  country: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  flag: string;
};

type SignupState = {
  companyName: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialState: SignupState = {
  companyName: '',
  country: '',
  currencyCode: '',
  currencySymbol: '',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function SignupForm() {
  const [formState, setFormState] = useState<SignupState>(initialState);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      try {
        setLoadingCountries(true);
        const response = await fetch('/api/countries');
        const payload = await response.json();
        if (!cancelled && payload?.ok) {
          setCountries(payload.data.countries ?? []);
        }
      } finally {
        if (!cancelled) setLoadingCountries(false);
      }
    }

    void loadCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const query = search.toLowerCase();
    return countries.filter((item) =>
      `${item.country} ${item.currencyCode} ${item.currencyName}`.toLowerCase().includes(query),
    );
  }, [countries, search]);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.country === formState.country) ?? null,
    [countries, formState.country],
  );

  const passwordScore = useMemo(() => {
    let score = 0;
    if (formState.password.length >= 8) score += 1;
    if (/[A-Z]/.test(formState.password)) score += 1;
    if (/[0-9]/.test(formState.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formState.password)) score += 1;
    return score;
  }, [formState.password]);

  function updateField<K extends keyof SignupState>(key: K, value: SignupState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedCountry) {
      setError('Please choose a country.');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          currencyCode: selectedCountry.currencyCode,
          currencySymbol: selectedCountry.currencySymbol,
          country: selectedCountry.country,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setError(payload?.error?.message ?? 'Unable to create your account.');
        return;
      }

      window.location.href = payload.data.redirectTo ?? '/dashboard/admin';
    } catch {
      setError('Unexpected error while creating account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden border-r border-border bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_35%),radial-gradient(circle_at_80%_65%,rgba(245,158,11,0.25),transparent_35%),linear-gradient(160deg,#0D1117,#141C2A)] p-12 lg:block">
        <p className="inline-flex rounded-full border border-accent-blue/40 bg-accent-blue/10 px-4 py-1 text-xs uppercase tracking-[0.18em] text-accent-cyan">
          ReambusX
        </p>
        <h1 className="mt-8 max-w-md font-heading text-4xl leading-tight text-white">
          Build trusted reimbursement workflows for every team.
        </h1>
        <p className="mt-5 max-w-md text-text-secondary">
          Configure approvals, auto-scan receipts, and keep every expense aligned with policy in one system.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-bg-card/80 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <h2 className="font-heading text-3xl text-white">Create your workspace</h2>
          <p className="mt-2 text-sm text-text-secondary">Start free, invite your team in minutes.</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Company Name</span>
                <input
                  value={formState.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Full Name</span>
                <input
                  value={formState.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Search Country</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type country or currency"
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Country</span>
                <select
                  value={formState.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  required
                  disabled={loadingCountries}
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                >
                  <option value="">{loadingCountries ? 'Loading countries...' : 'Select country'}</option>
                  {filteredCountries.map((item) => (
                    <option key={`${item.country}-${item.currencyCode}`} value={item.country}>
                      {item.flag} {item.country} ({item.currencyCode})
                    </option>
                  ))}
                </select>
              </label>
              {selectedCountry && (
                <p className="rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-sm text-accent-cyan">
                  Your company currency: {selectedCountry.flag} {selectedCountry.currencyCode} ({selectedCountry.currencySymbol})
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                />
              </label>
              <div />
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Password</span>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-text-secondary">Confirm Password</span>
                <input
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
                />
              </label>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                <span>Password strength</span>
                <span>{['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'][passwordScore]}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full ${index < passwordScore ? 'bg-accent-orange' : 'bg-bg-secondary'}`}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-cyan hover:text-accent-blue">
              Log In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
