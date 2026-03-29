type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
};

export default function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <article className="rounded-xl border border-border bg-bg-card p-5 shadow-lg shadow-black/25">
      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">{title}</p>
      <p className="mt-3 font-mono text-2xl text-text-primary">{value}</p>
      {helper ? <p className="mt-1 text-xs text-text-secondary">{helper}</p> : null}
    </article>
  );
}
