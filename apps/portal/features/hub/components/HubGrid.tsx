"use client";

import { DEPARTMENTS } from "~/lib/departments";
import { DepartmentCard } from "./DepartmentCard";

interface HubGridProps {
  accessibleDeptIds?: string[];
}

export function HubGrid({ accessibleDeptIds }: HubGridProps) {
  const departments =
    accessibleDeptIds && accessibleDeptIds.length > 0
      ? DEPARTMENTS.filter((d) => accessibleDeptIds.includes(d.name))
      : DEPARTMENTS;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
      {departments.map((dept, i) => (
        <DepartmentCard key={dept.name} department={dept} index={i} />
      ))}
    </div>
  );
}
