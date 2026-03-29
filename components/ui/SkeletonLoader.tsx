type SkeletonLoaderProps = {
  rows?: number;
  type?: 'table' | 'card' | 'stat';
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-4 w-16" />
      <div className="skeleton h-4 w-24" />
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-20" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="space-y-1">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export default function SkeletonLoader({ rows = 5, type = 'table' }: SkeletonLoaderProps) {
  if (type === 'stat') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
