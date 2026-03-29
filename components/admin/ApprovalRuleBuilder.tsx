'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';

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

function getRuleType(rule: Rule): { label: string; color: string; bg: string; border: string } {
  const hasPct = !!rule.minimum_approval_percentage;
  const hasSpecific = !!rule.specific_approver_id;
  if (hasPct && hasSpecific) return { label: 'Hybrid', color: 'text-accent-purple', bg: 'bg-accent-purple/10', border: 'border-accent-purple/20' };
  if (hasPct) return { label: 'Percentage', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20' };
  if (hasSpecific) return { label: 'Specific Approver', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' };
  return { label: 'Sequential', color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/20' };
}

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-heading text-2xl text-text-primary font-bold">Approval Rules</h1>
          <p className="text-sm text-text-secondary mt-1">Define how expenses move through the approval pipeline</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Rule
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-slide-in-left">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-slide-in-left">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<svg className="h-16 w-16 text-text-secondary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          title="No approval rules yet"
          description="Create your first rule to define how expenses get routed through the approval pipeline."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-shine rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110">
              Create First Rule
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => {
            const ruleType = getRuleType(rule);
            const isExpanded = expandedRule === rule.id;
            return (
              <div key={rule.id} className={`glass-card rounded-2xl overflow-hidden animate-fade-in-up anim-delay-${Math.min(i + 1, 8)}`}>
                {/* Rule Header */}
                <button
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl ${ruleType.bg} flex items-center justify-center`}>
                      <svg className={`h-5 w-5 ${ruleType.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-semibold text-text-primary">{rule.name}</h3>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${ruleType.color} ${ruleType.bg} ${ruleType.border}`}>
                          {ruleType.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rule.category && (
                          <span className="rounded-full bg-bg-secondary/60 border border-border/30 px-2 py-0.5 text-xs text-text-secondary">
                            {rule.category}
                          </span>
                        )}
                        {rule.min_amount && (
                          <span className="rounded-full bg-bg-secondary/60 border border-border/30 px-2 py-0.5 text-xs text-text-secondary">
                            Min: {rule.min_amount}
                          </span>
                        )}
                        {rule.max_amount && (
                          <span className="rounded-full bg-bg-secondary/60 border border-border/30 px-2 py-0.5 text-xs text-text-secondary">
                            Max: {rule.max_amount}
                          </span>
                        )}
                        <span className="rounded-full bg-accent-blue/10 border border-accent-blue/20 px-2 py-0.5 text-xs text-accent-cyan">
                          {rule.steps.length + (rule.is_manager_approver ? 1 : 0)} step{(rule.steps.length + (rule.is_manager_approver ? 1 : 0)) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`h-5 w-5 text-text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border/30 px-5 py-5 space-y-5 animate-fade-in">
                    {/* Approval Flow Diagram */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-text-secondary mb-3 font-medium">Approval Sequence</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {rule.is_manager_approver && (
                          <>
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-9 w-9 rounded-xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center">
                                <svg className="h-4 w-4 text-accent-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              </div>
                              <span className="text-[10px] text-accent-orange font-medium">Manager</span>
                            </div>
                            {rule.steps.length > 0 && (
                              <svg className="h-4 w-4 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            )}
                          </>
                        )}
                        {rule.steps.map((step, idx) => (
                          <div key={step.step_order} className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`h-9 w-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-heading font-bold text-xs text-accent-cyan`}>
                                {step.approver_name[0]?.toUpperCase()}
                              </div>
                              <span className="text-[10px] text-text-secondary max-w-[64px] truncate text-center">{step.approver_name.split(' ')[0]}</span>
                            </div>
                            {idx < rule.steps.length - 1 && (
                              <svg className="h-4 w-4 text-border mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            )}
                          </div>
                        ))}
                        {rule.steps.length === 0 && !rule.is_manager_approver && (
                          <p className="text-sm text-text-secondary italic">No steps defined — expenses auto-approve.</p>
                        )}
                      </div>
                    </div>

                    {/* Conditional Rules */}
                    {(rule.minimum_approval_percentage || rule.specific_approver_name) && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-text-secondary mb-3 font-medium">Conditional Auto-Approve</p>
                        <div className="space-y-2">
                          {rule.minimum_approval_percentage && (
                            <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <svg className="h-4 w-4 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                  <span className="text-xs font-medium text-accent-cyan">Percentage Rule</span>
                                </div>
                                <span className="font-mono font-bold text-accent-cyan text-sm">{rule.minimum_approval_percentage}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-bg-secondary/60 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan"
                                  style={{ width: `${rule.minimum_approval_percentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-text-secondary mt-1">If {rule.minimum_approval_percentage}% of approvers approve → expense auto-approved</p>
                            </div>
                          )}
                          {rule.specific_approver_name && (
                            <div className="rounded-xl border border-accent-amber/20 bg-accent-amber/5 p-3 flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-accent-amber/10 flex items-center justify-center font-heading font-bold text-accent-amber text-sm">
                                {rule.specific_approver_name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-accent-amber">Specific Approver Rule</p>
                                <p className="text-xs text-text-secondary">If <strong className="text-text-primary">{rule.specific_approver_name}</strong> approves → expense auto-approved</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delete */}
                    <div className="flex justify-end pt-2 border-t border-border/20">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger/70 hover:text-danger hover:bg-danger/5 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Delete Rule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateRuleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        managers={managers}
        onCreated={() => { setShowCreate(false); showSuccess('Rule created successfully!'); void fetchData(); }}
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

  const inputClass = "w-full rounded-xl border border-border/50 bg-bg-secondary/50 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent-blue/50 placeholder-text-secondary/40";
  const labelClass = "text-xs uppercase tracking-wider text-text-secondary font-medium";

  return (
    <Modal open={open} onClose={onClose} title="Create Approval Rule" wide>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        {/* Rule Name */}
        <label className="block space-y-1.5">
          <span className={labelClass}>Rule Name *</span>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            className={inputClass}
            placeholder="e.g. Travel Expenses Over ₹5,000"
          />
        </label>

        {/* Category + Amount Range */}
        <div className="grid grid-cols-3 gap-3">
          <label className="block space-y-1.5">
            <span className={labelClass}>Category</span>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputClass}>
              <option value="">Any Category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Min Amount</span>
            <input type="number" step="0.01" value={form.minAmount} onChange={(e) => setForm((p) => ({ ...p, minAmount: e.target.value }))} className={inputClass} placeholder="0" />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Max Amount</span>
            <input type="number" step="0.01" value={form.maxAmount} onChange={(e) => setForm((p) => ({ ...p, maxAmount: e.target.value }))} className={inputClass} placeholder="No limit" />
          </label>
        </div>

        {/* Manager First Toggle */}
        <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-border/40 bg-bg-secondary/30 px-4 py-3 hover:border-accent-orange/30 transition-colors">
          <div className="relative">
            <input
              type="checkbox"
              checked={form.isManagerApprover}
              onChange={(e) => setForm((p) => ({ ...p, isManagerApprover: e.target.checked }))}
              className="sr-only"
            />
            <div className={`h-5 w-9 rounded-full transition-colors duration-300 ${form.isManagerApprover ? 'bg-accent-orange' : 'bg-border'}`}>
              <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 translate-y-0.5 ${form.isManagerApprover ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Manager First Approver</p>
            <p className="text-xs text-text-secondary">Employee&apos;s direct manager will be Step 1, before the sequence below</p>
          </div>
        </label>

        {/* Approval Sequence */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className={labelClass}>Approval Sequence</p>
              <p className="text-xs text-text-secondary mt-0.5">Define who approves in which order</p>
            </div>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 px-3 py-1.5 text-xs font-semibold text-accent-cyan hover:bg-accent-blue/20 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Step
            </button>
          </div>

          {form.steps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 p-4 text-center">
              <p className="text-xs text-text-secondary">No steps added. Add approvers to define the sequence.</p>
              <p className="text-xs text-text-secondary/60 mt-1">Without steps, expenses will auto-approve based on conditional rules (if set).</p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-border/30 bg-bg-secondary/40 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-xs font-mono font-bold text-accent-cyan flex-shrink-0">
                    {step.stepOrder}
                  </div>
                  <select
                    value={step.approverId}
                    onChange={(e) => updateStep(index, 'approverId', e.target.value)}
                    className="flex-1 rounded-lg border border-border/40 bg-bg-secondary/50 px-2.5 py-1.5 text-sm text-text-primary outline-none focus:border-accent-blue/50"
                  >
                    <option value="">Select Approver</option>
                    {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={step.isRequired} onChange={(e) => updateStep(index, 'isRequired', e.target.checked)} className="accent-accent-orange" />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="rounded-lg p-1 text-danger/60 hover:text-danger hover:bg-danger/5 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conditional Rules */}
        <div className="rounded-xl border border-accent-purple/20 bg-accent-purple/5 p-4 space-y-4">
          <div>
            <p className={`${labelClass} text-accent-purple`}>Conditional Auto-Approve (Optional)</p>
            <p className="text-xs text-text-secondary mt-0.5">Set rules that trigger automatic approval regardless of the sequence</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                Minimum Approval %
              </span>
              <input
                type="number" min="1" max="100"
                value={form.minimumApprovalPercentage}
                onChange={(e) => setForm((p) => ({ ...p, minimumApprovalPercentage: e.target.value }))}
                className={inputClass}
                placeholder="e.g. 60"
              />
              <p className="text-xs text-text-secondary/70">If this % approve → auto-approve</p>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-accent-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Specific Approver
              </span>
              <select
                value={form.specificApproverId}
                onChange={(e) => setForm((p) => ({ ...p, specificApproverId: e.target.value }))}
                className={inputClass}
              >
                <option value="">None</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <p className="text-xs text-text-secondary/70">If this person approves → auto-approve</p>
            </label>
          </div>
          {form.minimumApprovalPercentage && form.specificApproverId && (
            <div className="flex items-center gap-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20 px-3 py-2">
              <svg className="h-4 w-4 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <p className="text-xs text-accent-purple font-medium">Hybrid mode: Either condition triggers auto-approval</p>
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-danger">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-shine w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-orange to-accent-amber px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-orange/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting
            ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Creating...</>
            : <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Create Rule</>
          }
        </button>
      </form>
    </Modal>
  );
}
