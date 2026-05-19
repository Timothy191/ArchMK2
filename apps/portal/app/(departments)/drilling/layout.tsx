import { DepartmentLayout } from "@repo/ui/DepartmentLayout";
import { DEPARTMENTS, getDepartmentTabs } from "~/lib/departments";
import { notFound } from "next/navigation";

export default async function DrillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dept = DEPARTMENTS.find((d) => d.name === "drilling");
  if (!dept) notFound();

  const tabs = getDepartmentTabs("drilling");

  return (
    <DepartmentLayout department={dept} tabs={tabs}>
      {children}
    </DepartmentLayout>
  );
}
