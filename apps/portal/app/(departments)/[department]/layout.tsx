import { DepartmentLayout } from "@repo/ui/DepartmentLayout";
import { DEPARTMENTS, getDepartmentTabs } from "~/lib/departments";
import { notFound } from "next/navigation";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { ActiveDepartmentSetter } from "@/components/nav/ActiveDepartmentSetter";

export default async function DepartmentRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ department: string }>;
}) {
  const { department } = await params;
  const dept = DEPARTMENTS.find((d) => d.name === department);
  if (!dept) notFound();

  const tabs = getDepartmentTabs(department);

  return (
    <>
      <ActiveDepartmentSetter department={department} />
      <DepartmentLayout department={dept} tabs={tabs}>
        {children}
        <AIAssistant context={`${dept.displayName} Department`} />
      </DepartmentLayout>
    </>
  );
}
