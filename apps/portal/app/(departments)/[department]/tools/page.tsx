import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { EXTERNAL_TOOLS } from "~/lib/tools";
import ToolsPageClient from "~/features/departments/components/tools/ToolsPageClient";

export default async function ToolsPage({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find((d) => d.name === params.department);
  if (!dept) notFound();

  // Build initial tools list (all unknown status until client checks)
  const initialTools = EXTERNAL_TOOLS.map((tool) => ({
    ...tool,
    status: "unknown" as const,
  }));

  return (
    <ToolsPageClient departmentName={dept.name} initialTools={initialTools} />
  );
}
