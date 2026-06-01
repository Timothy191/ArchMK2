"use client";

import Image from "next/image";
import { useFocusMode } from "@/hooks/useFocusMode";

interface HeroBackgroundProps {
  src: string;
  alt: string;
}

export function HeroBackground({ src, alt }: HeroBackgroundProps) {
  const { enabled } = useFocusMode();

  if (enabled) return null;

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover opacity-[0.12]"
        sizes="(max-width: 768px) 100vw, 70vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-arch-accent-blue/5 pointer-events-none" />
    </>
  );
}
