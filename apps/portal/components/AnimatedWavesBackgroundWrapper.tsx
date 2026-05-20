"use client";

import dynamic from "next/dynamic";

const AnimatedWavesBackground = dynamic(
  () =>
    import("@/components/AnimatedWavesBackground").then(
      (m) => m.AnimatedWavesBackground,
    ),
  { ssr: false },
);

export function AnimatedWavesBackgroundWrapper() {
  return <AnimatedWavesBackground />;
}
