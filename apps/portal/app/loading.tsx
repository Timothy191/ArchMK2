export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--border-default)] border-t-[var(--accent-cyan)] rounded-full animate-spin" />
        <span className="text-[var(--text-muted)] text-sm">Loading...</span>
      </div>
    </div>
  );
}
