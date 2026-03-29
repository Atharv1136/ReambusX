'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ApprovalTimeline from '@/components/ui/ApprovalTimeline';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
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
  current_step: number;
  expense_date: string;
  created_at: string;
};

type ApprovalStep = {
  approver_name: string;
  step_order: number;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  actioned_at: string | null;
};

type ExpenseDetail = Expense & { approvals: ApprovalStep[] };

const STATUSES = ['all', 'draft', 'pending', 'approved', 'rejected'] as const;

export default function AdminExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);
  const [overrideModal, setOverrideModal] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<'approved' | 'rejected'>('approved');
  const [overrideComment, setOverrideComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/expenses?${params}`);
      const data = await res.json();
      if (data.ok) setExpenses(data.data.expenses);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { void fetchExpenses(); }, [fetchExpenses]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleOverride() {
    if (!overrideModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/expenses/${overrideModal}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: overrideStatus, comment: overrideComment || null }),
      });
      const data = await res.json();
      if (data.ok) {
        showSuccess(`Expense ${overrideStatus} via admin override.`);
        setOverrideModal(null);
        setOverrideComment('');
        void fetchExpenses();
      }
    } finally {
      setActionLoading(false);
    }
  }

  function viewExpenseDetail(expenseId: string) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense) setSelectedExpense({ ...expense, approvals: [] });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-heading text-2xl text-text-primary font-bold">All Expenses</h1>
          <p className="text-sm text-text-secondary mt-1">Company-wide expense ledger with override controls</p>
        </div>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-slide-in-left">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-fade-in-up anim-delay-1">
        <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary/50 border border-border/30">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-accent-blue/10 text-accent-cyan border border-accent-blue/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, category..."
            className="w-full rounded-xl border border-border/40 bg-bg-secondary/50 pl-9 pr-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue/50 placeholder-text-secondary/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up anim-delay-2">
        {loading ? (
          <div className="p-4">
            <SkeletonLoader type="table" rows={6} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No expenses found" description="Try adjusting your filters or search query." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['Employee', 'Category', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, i) => (
                  <tr key={expense.id} className={`table-row-hover border-t border-border/20 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-accent-blue/10 flex items-center justify-center text-xs font-bold text-accent-cyan flex-shrink-0">
                          {expense.employee_name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-text-primary">{expense.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-bg-secondary/60 border border-border/20 px-2 py-0.5 text-xs text-text-secondary">{expense.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-text-primary">{expense.amount_in_company_currency}</span>
                      {expense.currency_code !== 'INR' && (
                        <span className="ml-1.5 text-xs text-text-secondary">({expense.amount} {expense.currency_code})</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={expense.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewExpenseDetail(expense.id)}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent-cyan border border-accent-blue/20 hover:bg-accent-blue/10 transition-colors"
                        >
                          View
                        </button>
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => { setOverrideModal(expense.id); setOverrideStatus('approved'); }}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent-amber border border-accent-orange/20 hover:bg-accent-orange/10 transition-colors"
                          >
                            Override
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <Modal open={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Detail" wide>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-bg-secondary/30 p-4">
              <div><p className="text-xs uppercase text-text-secondary mb-1">Employee</p><p className="text-text-primary font-medium">{selectedExpense.employee_name}</p></div>
              <div><p className="text-xs uppercase text-text-secondary mb-1">Category</p><p className="text-text-primary">{selectedExpense.category}</p></div>
              <div><p className="text-xs uppercase text-text-secondary mb-1">Amount</p><p className="font-mono font-bold text-text-primary">{selectedExpense.amount} {selectedExpense.currency_code}</p></div>
              <div><p className="text-xs uppercase text-text-secondary mb-1">Status</p><StatusBadge status={selectedExpense.status} /></div>
            </div>
            {selectedExpense.description && (
              <div className="rounded-xl bg-bg-secondary/20 border border-border/20 p-3">
                <p className="text-xs uppercase text-text-secondary mb-1">Description</p>
                <p className="text-sm text-text-primary">{selectedExpense.description}</p>
              </div>
            )}
            {selectedExpense.approvals.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-text-secondary mb-3">Approval Timeline</p>
                <ApprovalTimeline steps={selectedExpense.approvals} currentStep={selectedExpense.current_step} />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Override Modal */}
      <Modal open={!!overrideModal} onClose={() => setOverrideModal(null)} title="Admin Override">
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl bg-accent-amber/5 border border-accent-amber/20 p-3">
            <svg className="h-4 w-4 text-accent-amber flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-xs text-accent-amber/80">Admin override bypasses the normal approval workflow and immediately changes the expense status.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOverrideStatus('approved')}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${overrideStatus === 'approved' ? 'border-success/40 bg-success/10 text-success' : 'border-border/40 text-text-secondary hover:border-success/30'}`}
            >
              <svg className="h-4 w-4 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Approve
            </button>
            <button
              onClick={() => setOverrideStatus('rejected')}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${overrideStatus === 'rejected' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-border/40 text-text-secondary hover:border-danger/30'}`}
            >
              <svg className="h-4 w-4 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reject
            </button>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Comment (optional)</span>
            <textarea
              value={overrideComment}
              onChange={(e) => setOverrideComment(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border/40 bg-bg-secondary/50 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent-blue/50 resize-none"
              placeholder="Reason for override..."
            />
          </label>
          <button
            onClick={handleOverride}
            disabled={actionLoading}
            className={`btn-shine w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${overrideStatus === 'approved' ? 'bg-gradient-to-r from-success to-emerald-500' : 'bg-gradient-to-r from-danger to-rose-500'}`}
          >
            {actionLoading
              ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Processing...</>
              : `Confirm ${overrideStatus === 'approved' ? 'Approval' : 'Rejection'}`
            }
          </button>
        </div>
      </Modal>
    </div>
  );
}
