"use client";

import dynamic from "next/dynamic";

export const DynamicBackgroundWrapper = dynamic(
  () => import("./DynamicBackground").then((mod) => mod.DynamicBackground),
  { ssr: false }
);
