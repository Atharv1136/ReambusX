import type { ExpenseStatus } from '@/lib/types';

const statusConfig: Record<ExpenseStatus, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  pulse: boolean;
}> = {
  draft: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
    pulse: false,
  },
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    pulse: true,
  },
  approved: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    pulse: false,
  },
  rejected: {
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
    pulse: false,
  },
};

export default function StatusBadge({ status }: { status: ExpenseStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${config.bg} ${config.text} ${config.border}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-dot-pulse' : ''}`}
      />
      {status}
    </span>
  );
}
