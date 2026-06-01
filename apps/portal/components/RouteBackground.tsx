"use client";

import { useFocusMode } from "@/hooks/useFocusMode";

/**
 * RouteBackground
 *
 * Renders the full-screen ambient background beneath all portal content.
 *
 * Layer stack (back → front, all z-index: -10 to -9):
 *   -10  │ <video>          – arch-bg.mp4 looping base (motion) OR
 *   -10  │ .route-bg-fallback – static gradient (prefers-reduced-motion)
 *    -9  │ tint overlay     – bg-white/55 glass wash (always visible)
 *    -9  │ .route-bg-shimmer – diagonal highlight (motion only)
 *
 * Focus mode: solid --bg-primary fill, no decoration, no video.
 *
 * Notes:
 *  • backdrop-blur is NOT applied to the tint overlay — browsers cannot
 *    blur a composited <video> layer and the property would create an
 *    extra compositor layer for zero visual benefit.
 *  • The tint overlay is always visible (even under prefers-reduced-motion)
 *    so the static fallback gradient is also glass-washed for legibility.
 *  • will-change: transform on the video promotes it to its own layer
 *    immediately, preventing re-paint when the CSS transition kicks in.
 */
export function RouteBackground() {
  const focusMode = useFocusMode((s) => s.enabled);

  if (focusMode) {
    return (
      <>
        {/* Focus background — full-screen image */}
        <div className="route-bg-focus" aria-hidden="true" />
        {/* Legibility scrim over the image */}
        <div className="route-bg-focus-scrim" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      {/* ── Base layer: video (motion) OR static gradient (reduced-motion) ── */}
      <video
        className="route-bg-video motion-reduce:hidden"
        src="/arch-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        disablePictureInPicture
      />

      {/* Static gradient fallback — visible only under prefers-reduced-motion */}
      <div
        className="route-bg-fallback motion-reduce:block hidden"
        aria-hidden="true"
      />

      {/* ── Tint overlay — always visible; no backdrop-blur (see notes above) ── */}
      <div className="route-bg-tint" aria-hidden="true" />

      {/* ── Shimmer — faint diagonal highlight, motion only ── */}
      <div
        className="route-bg-shimmer motion-reduce:hidden"
        aria-hidden="true"
      />
    </>
  );
}
