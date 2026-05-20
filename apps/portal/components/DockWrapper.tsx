"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { DockIconProps, DockProps } from "@repo/ui/dock";

export const Dock: ComponentType<DockProps> = dynamic(
  () => import("@repo/ui/dock").then((m) => m.Dock),
  { ssr: false },
);

export const DockIcon: ComponentType<DockIconProps> = dynamic(
  () => import("@repo/ui/dock").then((m) => m.DockIcon),
  { ssr: false },
);
