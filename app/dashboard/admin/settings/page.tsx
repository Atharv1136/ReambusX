import { requireRole } from '@/lib/auth-guards';

export default async function AdminSettingsPage() {
  await requireRole(['admin']);

  return (
    <section className="rounded-xl border border-border bg-bg-card p-6">
      <h1 className="font-heading text-2xl text-text-primary">Settings</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Company profile, policies, and configuration controls will be added in a follow-up iteration.
      </p>
    </section>
  );
}
