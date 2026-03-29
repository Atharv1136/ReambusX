'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { ExpenseStatus } from '@/lib/types';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

type Expense = {
  id: string;
  category: string;
  description: string | null;
  amount: string;
  currency_code: string;
  amount_in_company_currency: string;
  status: ExpenseStatus;
  expense_date: string;
  created_at: string;
};

const STATUSES = ['all', 'pending', 'approved', 'rejected'] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  Travel: '✈️', Food: '🍔', 'Office Supplies': '📎', Medical: '💊', Miscellaneous: '📦',
};

export default function ExpenseHistoryTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employee/expenses');
      const data = await res.json();
      if (data.ok) setExpenses(data.data.expenses);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchExpenses(); }, [fetchExpenses]);

  const filtered = filter === 'all' ? expenses : expenses.filter((e) => e.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-heading text-2xl text-text-primary font-bold">My Expenses</h1>
          <p className="text-sm text-text-secondary mt-1">Your complete expense history</p>
        </div>
        <Link
          href="/dashboard/employee/submit"
          className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Expense
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 animate-fade-in-up anim-delay-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition-all border ${
              filter === s
                ? 'bg-accent-blue/10 text-accent-cyan border-accent-blue/30 shadow-sm'
                : 'text-text-secondary border-border/30 hover:border-border/60 hover:text-text-primary'
            }`}
          >
            {s === 'all' ? 'All Expenses' : s}
            {s !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({expenses.filter(e => e.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up anim-delay-2">
        {loading ? (
          <div className="p-4">
            <SkeletonLoader type="table" rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={filter === 'all' ? 'No expenses yet' : `No ${filter} expenses`}
              description={filter === 'all' ? 'Submit your first expense to get started.' : `You have no ${filter} expenses.`}
              action={filter === 'all' ? (
                <Link href="/dashboard/employee/submit" className="inline-flex items-center gap-1.5 rounded-xl bg-accent-orange/10 px-4 py-2 text-sm font-medium text-accent-orange hover:bg-accent-orange/20 transition-colors">
                  Submit First Expense →
                </Link>
              ) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['Category', 'Description', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense, i) => (
                  <tr key={expense.id} className={`table-row-hover border-t border-border/20 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2">
                        <span>{CATEGORY_EMOJI[expense.category] ?? '📋'}</span>
                        <span className="font-medium text-text-primary">{expense.category}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary max-w-[200px] truncate text-xs">
                      {expense.description || <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-text-primary">{expense.amount}</span>
                      <span className="ml-1 text-xs text-text-secondary">{expense.currency_code}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={expense.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
