'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ApprovalTimeline from '@/components/ui/ApprovalTimeline';
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
        showSuccess(`Expense ${overrideStatus}.`);
        setOverrideModal(null);
        setOverrideComment('');
        void fetchExpenses();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function viewExpenseDetail(expenseId: string) {
    // Fetch from admin expenses — for now reuse the list data + mock approvals
    // In production, you'd have a dedicated detail endpoint
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense) {
      setSelectedExpense({ ...expense, approvals: [] });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-text-primary">All Expenses</h1>

      {successMsg && <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">{successMsg}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee, category..."
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue"
        />
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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-secondary">Loading...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No expenses found.</td></tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-border/60 hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{expense.employee_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{expense.category}</td>
                  <td className="px-4 py-3 font-mono text-text-primary">
                    {expense.amount_in_company_currency}
                    {expense.currency_code !== 'INR' && (
                      <span className="ml-1 text-xs text-text-secondary">({expense.amount} {expense.currency_code})</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={expense.status} /></td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => viewExpenseDetail(expense.id)} className="text-xs text-accent-cyan hover:text-accent-blue transition-colors">View</button>
                      {expense.status === 'pending' && (
                        <button onClick={() => { setOverrideModal(expense.id); setOverrideStatus('approved'); }} className="text-xs text-accent-orange hover:text-accent-amber transition-colors">Override</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <Modal open={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Detail" wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs uppercase text-text-secondary">Employee</p><p className="text-text-primary">{selectedExpense.employee_name}</p></div>
              <div><p className="text-xs uppercase text-text-secondary">Category</p><p className="text-text-primary">{selectedExpense.category}</p></div>
              <div><p className="text-xs uppercase text-text-secondary">Amount</p><p className="font-mono text-text-primary">{selectedExpense.amount} {selectedExpense.currency_code}</p></div>
              <div><p className="text-xs uppercase text-text-secondary">Status</p><StatusBadge status={selectedExpense.status} /></div>
            </div>
            {selectedExpense.description && (
              <div><p className="text-xs uppercase text-text-secondary">Description</p><p className="text-sm text-text-primary mt-1">{selectedExpense.description}</p></div>
            )}
            {selectedExpense.approvals.length > 0 && (
              <div>
                <p className="text-xs uppercase text-text-secondary mb-2">Approval Timeline</p>
                <ApprovalTimeline steps={selectedExpense.approvals} currentStep={selectedExpense.current_step} />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Override Modal */}
      <Modal open={!!overrideModal} onClose={() => setOverrideModal(null)} title="Admin Override">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOverrideStatus('approved')}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${overrideStatus === 'approved' ? 'border-success bg-success/10 text-success' : 'border-border text-text-secondary hover:border-success/50'}`}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => setOverrideStatus('rejected')}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${overrideStatus === 'rejected' ? 'border-danger bg-danger/10 text-danger' : 'border-border text-text-secondary hover:border-danger/50'}`}
            >
              ✕ Reject
            </button>
          </div>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Comment (optional)</span>
            <textarea
              value={overrideComment}
              onChange={(e) => setOverrideComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue resize-none"
            />
          </label>
          <button
            onClick={handleOverride}
            disabled={actionLoading}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${overrideStatus === 'approved' ? 'bg-success' : 'bg-danger'}`}
          >
            {actionLoading ? 'Processing...' : `Confirm ${overrideStatus === 'approved' ? 'Approval' : 'Rejection'}`}
          </button>
        </div>
      </Modal>
    </div>
  );
}
