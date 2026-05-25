function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-[var(--bg-tertiary)]/60 ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        }}
      />
    </div>
  );
}

export default function DepartmentLoading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <ShimmerBlock className="h-8 w-48 rounded" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/40 backdrop-blur-xl p-5 space-y-3">
          <ShimmerBlock className="h-3 w-24 rounded" />
          <ShimmerBlock className="h-8 w-16 rounded" />
          <ShimmerBlock className="h-3 w-32 rounded" />
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/40 backdrop-blur-xl p-5 space-y-3">
          <ShimmerBlock className="h-3 w-24 rounded" />
          <ShimmerBlock className="h-8 w-16 rounded" />
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/40 backdrop-blur-xl p-5 space-y-3">
          <ShimmerBlock className="h-3 w-24 rounded" />
          <ShimmerBlock className="h-8 w-16 rounded" />
          <ShimmerBlock className="h-3 w-28 rounded" />
        </div>
      </div>

      {/* Content area skeleton */}
      <ShimmerBlock className="h-64 w-full rounded-2xl" />
    </div>
  );
}
