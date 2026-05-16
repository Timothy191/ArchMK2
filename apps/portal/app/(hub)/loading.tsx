import { RevealLoader } from "@repo/ui/RevealLoader";

export default function HubLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        <div className="h-4 w-96 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </div>
      <RevealLoader rows={7} columns={1} />
    </div>
  );
}
