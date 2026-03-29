'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
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

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ approval: Approval; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

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
        showSuccess(`Expense ${actionModal.action === 'approve' ? 'approved' : 'rejected'}.`);
        setActionModal(null);
        setComment('');
        void fetchApprovals();
      }
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-text-primary">My Approvals</h1>
      <p className="text-sm text-text-secondary">Expenses waiting for your approval decision.</p>

      {successMsg && <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">{successMsg}</p>}

      {loading ? (
        <p className="py-8 text-center text-text-secondary">Loading...</p>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-text-secondary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-text-secondary">No pending approvals. You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {approvals.map((approval) => (
            <div key={approval.approval_id} className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/20 hover:border-accent-blue/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-heading text-lg text-text-primary">{approval.employee_name}</p>
                  <p className="text-xs text-text-secondary">{approval.employee_email}</p>
                </div>
                <StatusBadge status={approval.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs uppercase text-text-secondary">Category</p>
                  <p className="text-text-primary">{approval.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Amount</p>
                  <p className="font-mono text-text-primary">{approval.amount_in_company_currency}</p>
                  {approval.currency_code && (
                    <p className="text-xs text-text-secondary">{approval.amount} {approval.currency_code}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Date</p>
                  <p className="text-text-primary">{new Date(approval.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Step</p>
                  <p className="text-accent-cyan">Step {approval.approval_step_order}</p>
                </div>
              </div>

              {approval.description && (
                <p className="mt-2 text-xs text-text-secondary italic truncate">{approval.description}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setActionModal({ approval, action: 'approve' })}
                  className="flex-1 rounded-lg bg-success/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-success"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setActionModal({ approval, action: 'reject' })}
                  className="flex-1 rounded-lg bg-danger/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-danger"
                >
                  ✕ Reject
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
        title={actionModal?.action === 'approve' ? 'Approve Expense' : 'Reject Expense'}
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-bg-secondary p-3 text-sm">
              <p className="text-text-primary font-medium">{actionModal.approval.employee_name} — {actionModal.approval.category}</p>
              <p className="font-mono text-text-primary mt-1">{actionModal.approval.amount} {actionModal.approval.currency_code}</p>
            </div>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Comment (optional)</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue resize-none"
                placeholder="Add a comment..."
              />
            </label>
            <button
              onClick={handleAction}
              disabled={actionLoading}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 ${
                actionModal.action === 'approve' ? 'bg-success' : 'bg-danger'
              }`}
            >
              {actionLoading ? 'Processing...' : actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
