import type { ExpenseStatus } from '@/lib/types';

const statusClassMap: Record<ExpenseStatus, string> = {
  draft: 'bg-slate-600/20 text-slate-300 border-slate-500/40',
  pending: 'bg-warning/20 text-warning border-warning/40',
  approved: 'bg-success/20 text-success border-success/40',
  rejected: 'bg-danger/20 text-danger border-danger/40',
};

export default function StatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs capitalize ${statusClassMap[status]}`}>
      {status}
    </span>
  );
}
