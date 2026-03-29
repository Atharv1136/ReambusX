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
    return <p className="text-sm text-text-secondary">No approval steps configured.</p>;
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isActive = step.step_order === currentStep && step.status === 'pending';
        const isDone = step.status === 'approved' || step.status === 'rejected';
        const isLast = index === steps.length - 1;

        return (
          <div key={step.step_order} className="flex gap-3">
            {/* Timeline line & dot */}
            <div className="flex flex-col items-center">
              <div
                className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                  step.status === 'approved'
                    ? 'border-success bg-success/20'
                    : step.status === 'rejected'
                      ? 'border-danger bg-danger/20'
                      : isActive
                        ? 'border-accent-orange bg-accent-orange/20 animate-pulse'
                        : 'border-border bg-bg-secondary'
                }`}
              />
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[2rem] ${
                    isDone ? 'bg-border' : 'bg-border/40'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary">
                  Step {step.step_order}: {step.approver_name}
                </p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${
                    step.status === 'approved'
                      ? 'bg-success/20 text-success'
                      : step.status === 'rejected'
                        ? 'bg-danger/20 text-danger'
                        : isActive
                          ? 'bg-accent-orange/20 text-accent-orange'
                          : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {isActive ? 'awaiting' : step.status}
                </span>
              </div>
              {step.comment && (
                <p className="mt-1 text-xs text-text-secondary italic">&ldquo;{step.comment}&rdquo;</p>
              )}
              {step.actioned_at && (
                <p className="mt-0.5 text-xs text-text-secondary">
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
