'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { ExpenseStatus } from '@/lib/types';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';

type Expense = {
  id: string;
  employee_name: string;
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

export default function TeamExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/manager/team');
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
          <h1 className="font-heading text-2xl text-text-primary font-bold">Team Expenses</h1>
          <p className="text-sm text-text-secondary mt-1">Expenses from your direct reports</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border/40 bg-bg-secondary/40 px-3 py-2 text-xs text-text-secondary">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {loading ? '...' : `${expenses.length} total expense${expenses.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap animate-fade-in-up anim-delay-1">
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
            {s === 'all' ? 'All' : s}
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
              icon={
                <svg className="h-16 w-16 text-text-secondary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              }
              title="No team expenses found"
              description={filter === 'all' ? 'Your team members haven\'t submitted any expenses yet.' : `No ${filter} expenses from your team.`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['Employee', 'Category', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense, i) => (
                  <tr key={expense.id} className={`table-row-hover border-t border-border/20 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-accent-orange/10 flex items-center justify-center text-xs font-bold text-accent-amber flex-shrink-0">
                          {expense.employee_name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-text-primary">{expense.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5">
                        <span>{CATEGORY_EMOJI[expense.category] ?? '📋'}</span>
                        <span className="text-text-secondary text-xs">{expense.category}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-text-primary">{expense.amount_in_company_currency}</span>
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
