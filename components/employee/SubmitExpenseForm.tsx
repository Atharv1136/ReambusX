'use client';

import { useState, useEffect } from 'react';
import ReceiptScanner from '@/components/employee/ReceiptScanner';

const CATEGORIES = ['Travel', 'Food', 'Office Supplies', 'Medical', 'Miscellaneous'] as const;

type SubmitExpenseFormProps = {
  companyCurrency: string;
};

export default function SubmitExpenseForm({ companyCurrency }: SubmitExpenseFormProps) {
  const [form, setForm] = useState({
    category: 'Miscellaneous' as string,
    description: '',
    amount: '',
    currencyCode: companyCurrency || 'USD',
    expenseDate: new Date().toISOString().split('T')[0],
  });
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Currency conversion preview
  useEffect(() => {
    if (!form.amount || form.currencyCode === companyCurrency) {
      setConvertedAmount(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoadingRate(true);
      try {
        const res = await fetch(`/api/exchange-rate/${form.currencyCode}`, {
          credentials: 'include',
        });
        const data = await res.json();
        const rates = data?.ok ? data.data?.rates : data?.rates;
        const rate = rates?.[companyCurrency];
        if (rate) {
          setConvertedAmount(Math.round(parseFloat(form.amount) * rate * 100) / 100);
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingRate(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.amount, form.currencyCode, companyCurrency]);

  function handleOcrResult(result: {
    amount: number | null;
    date: string | null;
    category: string;
    description: string | null;
    currencyCode: string | null;
  }) {
    setForm((prev) => ({
      ...prev,
      amount: result.amount?.toString() ?? prev.amount,
      category: CATEGORIES.includes(result.category as typeof CATEGORIES[number]) ? result.category : prev.category,
      description: result.description ?? prev.description,
      expenseDate: result.date ? normalizeDate(result.date) : prev.expenseDate,
      currencyCode: result.currencyCode && /^[A-Z]{3}$/.test(result.currencyCode) ? result.currencyCode : prev.currencyCode,
    }));
  }

  function normalizeDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch { /* ignore */ }
    return dateStr;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/employee/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: form.category,
          description: form.description || null,
          amount: parseFloat(form.amount),
          currencyCode: form.currencyCode,
          expenseDate: form.expenseDate,
        }),
      });

      let data: { ok?: boolean; error?: { message?: string } } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 800);
          return;
        }

        if (res.status === 503) {
          setError(data?.error?.message ?? 'Service is temporarily unavailable. Please retry in a few seconds.');
          return;
        }

        setError(data?.error?.message ?? `Failed to submit expense (HTTP ${res.status}).`);
        return;
      }

      setSuccess(true);
      setForm({ category: 'Miscellaneous', description: '', amount: '', currencyCode: companyCurrency || 'USD', expenseDate: new Date().toISOString().split('T')[0] });
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('Network error while submitting expense. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl text-text-primary">Submit Expense</h1>

      {success && (
        <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          ✓ Expense submitted successfully! It&apos;s now in the approval queue.
        </div>
      )}

      {/* Receipt Scanner */}
      <div className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/20">
        <h2 className="font-heading text-lg text-text-primary mb-3">Receipt Scanner (OCR)</h2>
        <p className="text-xs text-text-secondary mb-3">Upload a receipt image to auto-fill expense details.</p>
        <ReceiptScanner onResult={handleOcrResult} />
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/20 space-y-4">
        <h2 className="font-heading text-lg text-text-primary">Expense Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Category</span>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Date</span>
            <input type="date" value={form.expenseDate} onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary">Description</span>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue resize-none" placeholder="Describe the expense..." />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Amount</span>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue font-mono" placeholder="0.00" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Currency</span>
            <input type="text" maxLength={3} value={form.currencyCode} onChange={(e) => setForm((p) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue font-mono uppercase" placeholder="USD" />
          </label>
        </div>

        {/* Currency conversion preview */}
        {form.amount && form.currencyCode !== companyCurrency && (
          <div className="rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-4 py-2.5 text-sm">
            {loadingRate ? (
              <span className="text-accent-cyan animate-pulse">Converting...</span>
            ) : convertedAmount !== null ? (
              <span className="text-accent-cyan">
                ≈ {convertedAmount.toLocaleString()} {companyCurrency} <span className="text-text-secondary">(company currency)</span>
              </span>
            ) : (
              <span className="text-text-secondary">Unable to convert to {companyCurrency}</span>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Expense'}
        </button>
      </form>
    </div>
  );
}
