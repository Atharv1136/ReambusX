import { requireRole } from '@/lib/auth-guards';

export default async function SubmitExpensePage() {
  await requireRole(['employee', 'manager', 'admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">Submit Expense</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Receipt upload, OCR autofill, currency conversion, and submission workflow are currently being wired.
      </p>
    </section>
  );
}
