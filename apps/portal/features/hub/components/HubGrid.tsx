"use client";

import { BentoGrid } from "@repo/ui/BentoGrid";
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
    <BentoGrid>
      {departments.map((dept, i) => (
        <DepartmentCard key={dept.name} department={dept} index={i} />
      ))}
    </BentoGrid>
  );
}
