'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';

type ApproverStep = {
  approver_id: string;
  approver_name: string;
  step_order: number;
  is_required: boolean;
};

type Rule = {
  id: string;
  name: string;
  category: string | null;
  min_amount: string | null;
  max_amount: string | null;
  is_manager_approver: boolean;
  minimum_approval_percentage: string | null;
  specific_approver_id: string | null;
  specific_approver_name: string | null;
  steps: ApproverStep[];
};

type Manager = { id: string; name: string; email: string };

const CATEGORIES = ['All', 'Travel', 'Food', 'Office Supplies', 'Medical', 'Miscellaneous'];

export default function ApprovalRuleBuilder() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rulesRes, usersRes] = await Promise.all([
        fetch('/api/admin/approval-rules'),
        fetch('/api/admin/users'),
      ]);
      const rulesData = await rulesRes.json();
      const usersData = await usersRes.json();
      if (rulesData.ok) setRules(rulesData.data.rules);
      if (usersData.ok) setManagers(usersData.data.managers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Delete this approval rule?')) return;
    const res = await fetch(`/api/admin/approval-rules/${ruleId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) { setError(data.error?.message ?? 'Failed to delete.'); return; }
    showSuccess('Rule deleted.');
    void fetchData();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">Approval Rules</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
        >
          + Create Rule
        </button>
      </div>

      {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}
      {successMsg && <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">{successMsg}</p>}

      {loading ? (
        <p className="text-text-secondary text-sm py-8 text-center">Loading...</p>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
          <p className="text-text-secondary">No approval rules configured yet.</p>
          <p className="mt-1 text-xs text-text-secondary">Create your first rule to define how expenses get approved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-border bg-bg-card shadow-lg shadow-black/20 overflow-hidden">
              <button
                onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-bg-secondary/30 transition-colors"
              >
                <div>
                  <h3 className="font-heading text-lg text-text-primary">{rule.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-secondary">
                    {rule.category && <span className="rounded-full bg-bg-secondary px-2 py-0.5">Category: {rule.category}</span>}
                    {rule.min_amount && <span className="rounded-full bg-bg-secondary px-2 py-0.5">Min: {rule.min_amount}</span>}
                    {rule.max_amount && <span className="rounded-full bg-bg-secondary px-2 py-0.5">Max: {rule.max_amount}</span>}
                    {rule.is_manager_approver && <span className="rounded-full bg-accent-blue/20 text-accent-cyan px-2 py-0.5">Manager First</span>}
                    <span className="rounded-full bg-bg-secondary px-2 py-0.5">{rule.steps.length} step(s)</span>
                  </div>
                </div>
                <svg className={`h-5 w-5 text-text-secondary transition-transform ${expandedRule === rule.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {expandedRule === rule.id && (
                <div className="border-t border-border px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-secondary mb-1">Conditional Rules</p>
                      {rule.minimum_approval_percentage && (
                        <p className="text-text-primary">✓ If {rule.minimum_approval_percentage}% of approvers approve → Auto-approved</p>
                      )}
                      {rule.specific_approver_name && (
                        <p className="text-text-primary">✓ If {rule.specific_approver_name} approves → Auto-approved</p>
                      )}
                      {!rule.minimum_approval_percentage && !rule.specific_approver_name && (
                        <p className="text-text-secondary">No conditional rules</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-secondary mb-1">Approval Sequence</p>
                      {rule.is_manager_approver && (
                        <p className="text-accent-cyan text-sm">Step 0: Employee&apos;s Manager (auto)</p>
                      )}
                      {rule.steps.map((step) => (
                        <p key={step.step_order} className="text-text-primary text-sm">
                          Step {step.step_order}: {step.approver_name}
                          {!step.is_required && <span className="text-text-secondary"> (optional)</span>}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => handleDelete(rule.id)} className="text-xs text-danger/80 hover:text-danger transition-colors">Delete Rule</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateRuleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        managers={managers}
        onCreated={() => { setShowCreate(false); showSuccess('Rule created.'); void fetchData(); }}
      />
    </div>
  );
}

function CreateRuleModal({ open, onClose, managers, onCreated }: {
  open: boolean;
  onClose: () => void;
  managers: Manager[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    category: '' as string,
    minAmount: '',
    maxAmount: '',
    isManagerApprover: false,
    minimumApprovalPercentage: '',
    specificApproverId: '',
    steps: [] as { approverId: string; stepOrder: number; isRequired: boolean }[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStep() {
    setForm((p) => ({
      ...p,
      steps: [...p.steps, { approverId: '', stepOrder: p.steps.length + 1, isRequired: true }],
    }));
  }

  function removeStep(index: number) {
    setForm((p) => ({
      ...p,
      steps: p.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })),
    }));
  }

  function updateStep(index: number, field: string, value: unknown) {
    setForm((p) => ({
      ...p,
      steps: p.steps.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/approval-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category || null,
          minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
          maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : null,
          isManagerApprover: form.isManagerApprover,
          minimumApprovalPercentage: form.minimumApprovalPercentage ? parseFloat(form.minimumApprovalPercentage) : null,
          specificApproverId: form.specificApproverId || null,
          steps: form.steps.filter((s) => s.approverId),
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to create rule.'); return; }
      setForm({ name: '', category: '', minAmount: '', maxAmount: '', isManagerApprover: false, minimumApprovalPercentage: '', specificApproverId: '', steps: [] });
      onCreated();
    } catch {
      setError('Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Approval Rule" wide>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-text-secondary">Rule Name</span>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" placeholder="e.g. Travel Expenses Over 500" />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Category</span>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
              <option value="">Any</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Min Amount</span>
            <input type="number" step="0.01" value={form.minAmount} onChange={(e) => setForm((p) => ({ ...p, minAmount: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" placeholder="0" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Max Amount</span>
            <input type="number" step="0.01" value={form.maxAmount} onChange={(e) => setForm((p) => ({ ...p, maxAmount: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" placeholder="No limit" />
          </label>
        </div>

        <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border bg-bg-secondary px-4 py-3">
          <input type="checkbox" checked={form.isManagerApprover} onChange={(e) => setForm((p) => ({ ...p, isManagerApprover: e.target.checked }))} className="h-4 w-4 rounded border-border accent-accent-orange" />
          <div>
            <p className="text-sm text-text-primary font-medium">Manager First Approver</p>
            <p className="text-xs text-text-secondary">Employee&apos;s direct manager will be Step 1, before the sequence below</p>
          </div>
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Approval Sequence</p>
            <button type="button" onClick={addStep} className="text-xs text-accent-cyan hover:text-accent-blue transition-colors">+ Add Step</button>
          </div>
          {form.steps.length === 0 && (
            <p className="text-xs text-text-secondary rounded-lg border border-border/60 p-3 text-center">No steps added yet. Add approvers to define the sequence.</p>
          )}
          {form.steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-bg-primary/50 px-3 py-2">
              <span className="text-xs text-text-secondary font-mono w-6">#{step.stepOrder}</span>
              <select
                value={step.approverId}
                onChange={(e) => updateStep(index, 'approverId', e.target.value)}
                className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent-blue"
              >
                <option value="">Select Approver</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
                <input type="checkbox" checked={step.isRequired} onChange={(e) => updateStep(index, 'isRequired', e.target.checked)} className="accent-accent-orange" />
                Required
              </label>
              <button type="button" onClick={() => removeStep(index)} className="text-danger/70 hover:text-danger text-sm">✕</button>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-accent-blue/30 bg-accent-blue/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-accent-cyan">Conditional Approval (Optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-text-secondary">Minimum Approval %</span>
              <input type="number" min="1" max="100" value={form.minimumApprovalPercentage} onChange={(e) => setForm((p) => ({ ...p, minimumApprovalPercentage: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue" placeholder="e.g. 60" />
              <p className="text-xs text-text-secondary mt-0.5">If this % of approvers approve → auto-approve</p>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-text-secondary">Specific Approver (Auto-approve)</span>
              <select value={form.specificApproverId} onChange={(e) => setForm((p) => ({ ...p, specificApproverId: e.target.value }))} className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue">
                <option value="">None</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <p className="text-xs text-text-secondary mt-0.5">If this person approves → auto-approve</p>
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{submitting ? 'Creating...' : 'Create Rule'}</button>
      </form>
    </Modal>
  );
}
