import { DepartmentLayout } from "@repo/ui/DepartmentLayout";
import { DEPARTMENTS, getDepartmentTabs } from "~/lib/departments";
import { notFound } from "next/navigation";

export default async function EngineeringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dept = DEPARTMENTS.find((d) => d.name === "engineering");
  if (!dept) notFound();

  const tabs = getDepartmentTabs("engineering");

  return (
    <DepartmentLayout department={dept} tabs={tabs}>
      {children}
    </DepartmentLayout>
  );
}
