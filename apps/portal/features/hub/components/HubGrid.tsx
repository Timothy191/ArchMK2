"use client";

import { DEPARTMENTS } from "~/lib/departments";
import { DepartmentCard } from "./DepartmentCard";

export function HubGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
      {DEPARTMENTS.map((dept, i) => (
        <DepartmentCard key={dept.name} department={dept} index={i} />
      ))}
    </div>
  );
}
