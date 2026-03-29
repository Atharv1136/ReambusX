'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import ApprovalTimeline from '@/components/ui/ApprovalTimeline';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import type { ExpenseStatus } from '@/lib/types';

type Approval = {
  id: string;
  employee_name: string;
  employee_email: string;
  category: string;
  description: string | null;
  amount: string;
  currency_code: string;
  amount_in_company_currency: string;
  status: ExpenseStatus;
  expense_date: string;
  created_at: string;
  approval_id: string;
  approval_step_order: number;
};

const CATEGORY_EMOJI: Record<string, string> = {
  Travel: '✈️', Food: '🍔', 'Office Supplies': '📎', Medical: '💊', Miscellaneous: '📦',
};

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ approval: Approval; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successExpense, setSuccessExpense] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/manager/approvals');
      const data = await res.json();
      if (data.ok) setApprovals(data.data.approvals);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchApprovals(); }, [fetchApprovals]);

  async function handleAction() {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/manager/approvals/${actionModal.approval.approval_id}/${actionModal.action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment || null }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessExpense(actionModal.approval.employee_name);
        setActionModal(null);
        setComment('');
        setTimeout(() => setSuccessExpense(null), 4000);
        void fetchApprovals();
      }
    } finally {
      setActionLoading(false);
    }
  }

  const sortedApprovals = [...approvals].sort((a, b) => {
    if (filter === 'high') return parseFloat(b.amount_in_company_currency) - parseFloat(a.amount_in_company_currency);
    if (filter === 'low') return parseFloat(a.amount_in_company_currency) - parseFloat(b.amount_in_company_currency);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="font-heading text-2xl text-text-primary font-bold">My Approvals</h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? '...' : approvals.length === 0
              ? "You're all caught up! No pending approvals."
              : `${approvals.length} expense${approvals.length !== 1 ? 's' : ''} waiting for your decision`}
          </p>
        </div>
        {!loading && approvals.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Sort:</span>
            {(['all', 'high', 'low'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-accent-blue/10 text-accent-cyan border border-accent-blue/30'
                    : 'text-text-secondary hover:text-text-primary border border-transparent'
                }`}
              >
                {f === 'all' ? 'Default' : f === 'high' ? 'Highest ↑' : 'Lowest ↓'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Success Toast */}
      {successExpense && (
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-5 py-3 animate-slide-in-right">
          <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center text-success">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-sm text-success font-medium">Expense for {successExpense} has been actioned successfully.</p>
        </div>
      )}

      {/* States */}
      {loading ? (
        <SkeletonLoader type="card" rows={4} />
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-16 w-16 text-success/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
          title="All caught up!"
          description="No expenses are waiting for your approval right now. Check back later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedApprovals.map((approval, i) => (
            <div
              key={approval.approval_id}
              className={`glass-card rounded-2xl p-5 space-y-4 animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent-blue/10 flex items-center justify-center font-heading font-bold text-accent-cyan text-sm">
                    {approval.employee_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-text-primary">{approval.employee_name}</p>
                    <p className="text-xs text-text-secondary">{approval.employee_email}</p>
                  </div>
                </div>
                <StatusBadge status={approval.status} />
              </div>

              {/* Step Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-1 text-xs font-medium text-accent-cyan">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Step {approval.approval_step_order}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                  {CATEGORY_EMOJI[approval.category] ?? '📋'} {approval.category}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-bg-secondary/30 p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Amount</p>
                  <p className="font-mono font-bold text-text-primary text-sm">{approval.amount_in_company_currency}</p>
                  {approval.currency_code && (
                    <p className="text-xs text-text-secondary">{approval.amount} {approval.currency_code}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Expense Date</p>
                  <p className="text-text-primary text-sm">
                    {new Date(approval.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {approval.description && (
                <p className="text-xs text-text-secondary italic truncate bg-bg-secondary/20 rounded-lg px-3 py-2">
                  &ldquo;{approval.description}&rdquo;
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActionModal({ approval, action: 'approve' })}
                  className="btn-shine flex-1 flex items-center justify-center gap-2 rounded-xl bg-success/10 border border-success/20 px-3 py-2.5 text-sm font-semibold text-success hover:bg-success/20 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve
                </button>
                <button
                  onClick={() => setActionModal({ approval, action: 'reject' })}
                  className="btn-shine flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger/20 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => { setActionModal(null); setComment(''); }}
        title={actionModal?.action === 'approve' ? '✓ Approve Expense' : '✕ Reject Expense'}
      >
        {actionModal && (
          <div className="space-y-4">
            {/* Expense Summary */}
            <div className="rounded-xl border border-border/40 bg-bg-secondary/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-heading font-semibold text-text-primary">{actionModal.approval.employee_name}</p>
                <StatusBadge status={actionModal.approval.status} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-secondary">{actionModal.approval.category}</span>
                <span className="font-mono font-bold text-text-primary">{actionModal.approval.amount} {actionModal.approval.currency_code}</span>
              </div>
              <p className="text-xs text-text-secondary">
                Step {actionModal.approval.approval_step_order} of the approval sequence
              </p>
            </div>

            {/* Context depending on action */}
            {actionModal.action === 'approve' ? (
              <div className="flex items-start gap-2 rounded-xl bg-success/5 border border-success/20 p-3">
                <svg className="h-4 w-4 text-success flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p className="text-xs text-success/80">This will advance the expense to the next approval step. If this is the final step, it will be fully approved.</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl bg-danger/5 border border-danger/20 p-3">
                <svg className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p className="text-xs text-danger/80">This will reject the expense and cancel all remaining approval steps. The employee will be notified.</p>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Comment (optional)</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border/50 bg-bg-secondary/50 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent-blue/50 resize-none placeholder-text-secondary/40"
                placeholder="Add a note for the employee..."
              />
            </label>

            <button
              onClick={handleAction}
              disabled={actionLoading}
              className={`btn-shine w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${
                actionModal.action === 'approve'
                  ? 'bg-gradient-to-r from-success to-emerald-500 shadow-lg shadow-success/20'
                  : 'bg-gradient-to-r from-danger to-rose-500 shadow-lg shadow-danger/20'
              }`}
            >
              {actionLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              ) : actionModal.action === 'approve' ? (
                <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Confirm Approval</>
              ) : (
                <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Confirm Rejection</>
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
