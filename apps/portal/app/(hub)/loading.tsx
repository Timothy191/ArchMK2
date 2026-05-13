export default function HubLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-[#242424] rounded animate-pulse" />
        <div className="h-4 w-96 bg-[#242424] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-[#242424] rounded-2xl border border-[#363636] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
