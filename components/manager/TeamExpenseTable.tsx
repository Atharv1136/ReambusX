'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { ExpenseStatus } from '@/lib/types';

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

export default function TeamExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">Team Expenses</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-bg-card shadow-lg shadow-black/20 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-text-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No team expenses found.</td></tr>
            ) : (
              filtered.map((expense) => (
                <tr key={expense.id} className="border-t border-border/60 hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{expense.employee_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{expense.category}</td>
                  <td className="px-4 py-3 font-mono text-text-primary">{expense.amount_in_company_currency}</td>
                  <td className="px-4 py-3"><StatusBadge status={expense.status} /></td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
