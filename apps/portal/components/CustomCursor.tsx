"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { DEPARTMENTS } from "~/lib/departments";

// Mapped to CSS token values — aligned with packages/theme/src/css/variables.css
const COLOR_MAP: Record<string, string> = {
  amber: "var(--accent-orange)",
  emerald: "var(--accent-green)",
  blue: "var(--accent-blue)",
  violet: "var(--accent-blue)",
  red: "var(--accent-red)",
  orange: "var(--accent-orange)",
  cyan: "var(--accent-blue)",
  indigo: "var(--accent-blue)",
  default: "var(--accent-blue)",
};

export function CustomCursor() {
  const [isMounted, setIsMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Tight spring for the arrow — follows the real pointer closely
  const arrowSpringConfig = { damping: 30, stiffness: 400, mass: 0.4 };
  // Looser spring for the ambient glow — lags behind for a trailing feel
  const glowSpringConfig = { damping: 22, stiffness: 180, mass: 0.6 };

  const springX = useSpring(cursorX, arrowSpringConfig);
  const springY = useSpring(cursorY, arrowSpringConfig);
  const glowX = useSpring(cursorX, glowSpringConfig);
  const glowY = useSpring(cursorY, glowSpringConfig);

  useEffect(() => {
    setIsMounted(true);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("cursor-pointer")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);

    document.documentElement.classList.add("hide-cursor");

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.classList.remove("hide-cursor");
    };
  }, []);

  const activeColor = useMemo(() => {
    const deptName = pathname.split("/")[1];
    const dept = DEPARTMENTS.find((d) => d.name === deptName);
    const colorKey = dept?.color ?? "default";
    return COLOR_MAP[colorKey] ?? COLOR_MAP["default"];
  }, [pathname]);

  if (!isMounted) return null;

  return (
    <>
      {/* Ambient glow — trails loosely behind the cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full blur-[18px] opacity-[0.18]"
        style={{
          x: glowX,
          y: glowY,
          translateX: "-50%",
          translateY: "-50%",
          backgroundColor: activeColor,
          width: isHovering ? 56 : 40,
          height: isHovering ? 56 : 40,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Arrow cursor — snap-tracks the pointer with the tip at the hotspot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000]"
        style={{
          x: springX,
          y: springY,
          // Translate so the top-left corner of the image (arrow tip) sits on the hotspot
          translateX: "0%",
          translateY: "0%",
          width: 28,
          height: 28,
        }}
        animate={{ scale: isHovering ? 1.15 : 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundColor: activeColor,
            maskImage: "url('/cursors/icons8-cursor-100-3.png')",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "top left",
            WebkitMaskImage: "url('/cursors/icons8-cursor-100-3.png')",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "top left",
          }}
        />
      </motion.div>

      {/* Hover indicator dot — appears at the cursor tip when over interactive elements */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            key="hover-dot"
            className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
            style={{
              x: springX,
              y: springY,
              translateX: "12px",
              translateY: "20px",
              backgroundColor: activeColor,
              width: 5,
              height: 5,
              opacity: 0.9,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.9 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 400 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
