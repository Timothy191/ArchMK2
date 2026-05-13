import { DepartmentLayout } from "@repo/ui/DepartmentLayout";
import { DEPARTMENTS, getDepartmentTabs } from "~/lib/departments";
import { notFound } from "next/navigation";

export default async function DepartmentRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find((d) => d.name === params.department);
  if (!dept) notFound();

  const tabs = getDepartmentTabs(params.department);

  return (
    <DepartmentLayout department={dept} tabs={tabs}>
      {children}
    </DepartmentLayout>
  );
}
