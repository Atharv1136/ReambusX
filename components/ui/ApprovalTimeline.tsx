'use client';

type ApprovalStep = {
  approver_name: string;
  step_order: number;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  actioned_at: string | null;
};

type ApprovalTimelineProps = {
  steps: ApprovalStep[];
  currentStep: number;
};

export default function ApprovalTimeline({ steps, currentStep }: ApprovalTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4 text-center">
        <p className="text-sm text-text-secondary">No approval steps configured.</p>
      </div>
    );
  }

  const completedSteps = steps.filter(s => s.status === 'approved').length;
  const totalSteps = steps.length;
  const progressPct = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-0">
      {/* Progress Bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-bg-secondary/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-text-secondary font-mono">
          {completedSteps}/{totalSteps}
        </span>
      </div>

      {steps.map((step, index) => {
        const isActive = step.step_order === currentStep && step.status === 'pending';
        const isDone = step.status === 'approved' || step.status === 'rejected';
        const isLast = index === steps.length - 1;
        const animDelay = `anim-delay-${Math.min(index + 1, 8)}`;

        return (
          <div key={step.step_order} className={`flex gap-3 animate-fade-in-up ${animDelay}`}>
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`relative h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                  step.status === 'approved'
                    ? 'border-success bg-success/20'
                    : step.status === 'rejected'
                      ? 'border-danger bg-danger/20'
                      : isActive
                        ? 'border-accent-orange bg-accent-orange/20 animate-pulse-glow'
                        : 'border-border bg-bg-secondary'
                }`}
              >
                {step.status === 'approved' && (
                  <svg className="h-2.5 w-2.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {step.status === 'rejected' && (
                  <svg className="h-2.5 w-2.5 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-accent-orange animate-dot-pulse" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[2rem] transition-colors duration-500 ${
                    isDone ? 'bg-gradient-to-b from-border to-border/40' : 'bg-border/30'
                  }`}
                />
              )}
            </div>

            {/* Step Content */}
            <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {/* Avatar */}
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.status === 'approved'
                      ? 'bg-success/20 text-success'
                      : step.status === 'rejected'
                        ? 'bg-danger/20 text-danger'
                        : isActive
                          ? 'bg-accent-orange/20 text-accent-orange'
                          : 'bg-bg-secondary text-text-secondary'
                  }`}>
                    {step.approver_name[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    {step.approver_name}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    step.status === 'approved'
                      ? 'bg-success/10 text-success'
                      : step.status === 'rejected'
                        ? 'bg-danger/10 text-danger'
                        : isActive
                          ? 'bg-accent-orange/10 text-accent-orange'
                          : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {isActive ? '⏳ Awaiting' : step.status === 'approved' ? '✓ Approved' : step.status === 'rejected' ? '✕ Rejected' : 'Queued'}
                </span>
              </div>
              {step.comment && (
                <p className="mt-1 text-xs text-text-secondary/80 italic pl-8">&ldquo;{step.comment}&rdquo;</p>
              )}
              {step.actioned_at && (
                <p className="mt-0.5 text-xs text-text-secondary/60 pl-8">
                  {new Date(step.actioned_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
