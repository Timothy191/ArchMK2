"use client";

import dynamic from "next/dynamic";

const AIAssistantSidebar = dynamic(
  () =>
    import("@/features/shared/components/ai/AIAssistantSidebar").then(
      (m) => m.AIAssistantSidebar,
    ),
  { ssr: false },
);

export function AIAssistantSidebarWrapper() {
  return <AIAssistantSidebar />;
}
