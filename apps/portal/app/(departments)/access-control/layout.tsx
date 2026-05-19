import { DepartmentLayout } from "@repo/ui/DepartmentLayout";
import { DEPARTMENTS, getDepartmentTabs } from "~/lib/departments";
import { notFound } from "next/navigation";

export default async function AccessControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dept = DEPARTMENTS.find((d) => d.name === "access-control");
  if (!dept) notFound();

  const tabs = getDepartmentTabs("access-control");

  return (
    <DepartmentLayout department={dept} tabs={tabs}>
      {children}
    </DepartmentLayout>
  );
}
