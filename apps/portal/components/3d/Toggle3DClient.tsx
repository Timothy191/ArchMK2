"use client";

import dynamic from "next/dynamic";

const Toggle3D = dynamic(
  () =>
    import("@/components/3d/Toggle3D").then((mod) => ({
      default: mod.Toggle3D,
    })),
  {
    ssr: false,
    loading: () => <div className="w-8 h-6" />,
  },
);

export { Toggle3D };
