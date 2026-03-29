import { requireRole } from '@/lib/auth-guards';
import StatCard from '@/components/ui/StatCard';
import { getManagerDashboardStats } from '@/lib/repositories/dashboard-repository';
import Link from 'next/link';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function ManagerDashboardPage() {
  const session = await requireRole(['manager', 'admin']);
  const stats = await getManagerDashboardStats(session.id);
  const pendingCount = parseInt(stats?.pending_my_approval ?? '0');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="text-sm text-text-secondary">{getGreeting()},</p>
          <h1 className="font-heading text-2xl text-text-primary font-bold">
            {session.name} <span className="text-accent-blue">✦</span>
          </h1>
        </div>
        <Link
          href="/dashboard/manager/approvals"
          className="btn-shine relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110"
        >
          {pendingCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          View Approvals
        </Link>
      </div>

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending My Approval"
          value={stats?.pending_my_approval ?? '0'}
          accent="orange"
          delay={1}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          helper="Awaiting your decision"
        />
        <StatCard
          title="Approved by Me"
          value={stats?.approved_by_me ?? '0'}
          accent="green"
          delay={2}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          helper="All time approvals"
        />
        <StatCard
          title="Rejected by Me"
          value={stats?.rejected_by_me ?? '0'}
          accent="red"
          delay={3}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          helper="All time rejections"
        />
        <StatCard
          title="Total Team Expenses"
          value={stats?.total_team_expenses ?? '0'}
          accent="blue"
          delay={4}
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          helper="Direct reports"
        />
      </section>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div className="relative overflow-hidden glass-card rounded-2xl p-5 border-l-4 border-accent-orange animate-fade-in-up anim-delay-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-orange/10 flex items-center justify-center text-accent-orange animate-float">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div>
                <p className="font-heading font-semibold text-text-primary">
                  {pendingCount} expense{pendingCount !== 1 ? 's' : ''} awaiting your review
                </p>
                <p className="text-xs text-text-secondary">These need your approval decision</p>
              </div>
            </div>
            <Link
              href="/dashboard/manager/approvals"
              className="flex items-center gap-2 rounded-xl bg-accent-orange/10 px-4 py-2 text-sm font-semibold text-accent-orange hover:bg-accent-orange/20 transition-colors"
            >
              Review Now
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <section className="animate-fade-in-up anim-delay-5">
        <h2 className="font-heading text-sm uppercase tracking-widest text-text-secondary mb-3">Navigation</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/dashboard/manager/approvals" className="group glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-text-primary group-hover:text-accent-cyan transition-colors flex items-center gap-2">
                My Approvals
                {pendingCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </p>
              <p className="text-sm text-text-secondary mt-1">Review and act on pending expenses assigned to you</p>
            </div>
            <svg className="h-4 w-4 text-text-secondary/40 group-hover:text-accent-blue group-hover:translate-x-1 transition-all mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>

          <Link href="/dashboard/manager/team" className="group glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent-orange/10 flex items-center justify-center text-accent-orange flex-shrink-0 group-hover:bg-accent-orange/20 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">Team Expenses</p>
              <p className="text-sm text-text-secondary mt-1">View all expenses from your direct reports and track spending</p>
            </div>
            <svg className="h-4 w-4 text-text-secondary/40 group-hover:text-accent-orange group-hover:translate-x-1 transition-all mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
