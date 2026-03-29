import { requireRole } from '@/lib/auth-guards';
import { pool } from '@/lib/db';

type CompanyInfo = {
  name: string;
  country: string;
  currency_code: string;
  currency_symbol: string;
  created_at: string;
  user_count: string;
  expense_count: string;
};

export default async function AdminSettingsPage() {
  const session = await requireRole(['admin']);

  const { rows } = await pool.query<CompanyInfo>(
    `
      SELECT
        c.name, c.country, c.currency_code, c.currency_symbol, c.created_at::text,
        (SELECT COUNT(*)::text FROM users WHERE company_id = c.id) AS user_count,
        (SELECT COUNT(*)::text FROM expenses WHERE company_id = c.id) AS expense_count
      FROM companies c
      WHERE c.id = $1
      LIMIT 1
    `,
    [session.companyId],
  );

  const company = rows[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl text-text-primary">Settings</h1>

      <section className="rounded-xl border border-border bg-bg-card p-6 shadow-lg shadow-black/20">
        <h2 className="font-heading text-lg text-text-primary mb-4">Company Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Company Name</p>
            <p className="mt-1 text-text-primary font-medium">{company?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Country</p>
            <p className="mt-1 text-text-primary">{company?.country ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Currency</p>
            <p className="mt-1 text-text-primary font-mono">{company?.currency_symbol} {company?.currency_code}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Created</p>
            <p className="mt-1 text-text-primary">{company?.created_at ? new Date(company.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-6 shadow-lg shadow-black/20">
        <h2 className="font-heading text-lg text-text-primary mb-4">Statistics</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-border bg-bg-secondary p-4 text-center">
            <p className="font-mono text-2xl text-accent-cyan">{company?.user_count ?? '0'}</p>
            <p className="text-xs uppercase tracking-wider text-text-secondary mt-1">Total Users</p>
          </div>
          <div className="rounded-lg border border-border bg-bg-secondary p-4 text-center">
            <p className="font-mono text-2xl text-accent-orange">{company?.expense_count ?? '0'}</p>
            <p className="text-xs uppercase tracking-wider text-text-secondary mt-1">Total Expenses</p>
          </div>
        </div>
      </section>
    </div>
  );
}
