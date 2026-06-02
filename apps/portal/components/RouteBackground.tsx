"use client";

import { useFocusMode } from "@/hooks/useFocusMode";

/**
 * RouteBackground
 *
 * Renders the full-screen ambient background beneath all portal content.
 *
 * Layer stack (back → front, all z-index: -10 to -9):
 *   -10  │ <video>          – light-mode.mp4 (light mode, ambient loop)
 *   -10  │ <video>          – ps3-wave.mp4   (focus mode, ambient loop)
 *    -9  │ tint overlay     – bg-white/55 glass wash (always visible)
 *
 * Both videos are ALWAYS mounted — focus mode does not unmount the
 * light-mode video. Instead, CSS toggles which one is visible. This
 * keeps the decoder warm and the element in the GPU compositor, so
 * toggling between modes is instantaneous and neither video restarts
 * from frame zero when re-shown.
 *
 * Notes:
 *  • `data-bg-mode` is set on <html> by useFocusMode's effect; CSS
 *    selectors in glass.css use it to swap visibility & tint.
 *  • backdrop-blur is NOT applied to the tint overlay — browsers cannot
 *    blur a composited <video> layer and the property would create an
 *    extra compositor layer for zero visual benefit.
 *  • will-change: transform on the videos promotes them to their own
 *    layers immediately, preventing re-paint on first frame.
 */
export function RouteBackground() {
  // Subscribe to keep the component re-rendering on toggle. The actual
  // visibility is controlled via the `data-bg-mode` attribute on <html>,
  // set by useFocusMode — see glass.css `.route-bg-focus-video` rules.
  useFocusMode((s) => s.enabled);

  return (
    <>
      {/* ── Light mode: loop the user's video background ── */}
      <video
        id="route-bg-light-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="route-bg-video"
        aria-hidden="true"
      >
        <source src="/light-mode.mp4" type="video/mp4" />
      </video>

      {/* ── Focus mode: full-screen atmospheric video ── */}
      <video
        id="route-bg-focus-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="route-bg-focus-video"
        aria-hidden="true"
      >
        <source src="/ps3-wave.mp4" type="video/mp4" />
      </video>

      {/* ── Tint overlay — always visible for legibility scrim ── */}
      <div className="route-bg-tint" aria-hidden="true" />

      {/* ── Ambient Film Grain overlay — masks banding and adds crisp visual texture ── */}
      <div className="route-bg-grain" aria-hidden="true" />

      {/* ── Focus scrim — only painted when focus mode is active ── */}
      <div className="route-bg-focus-scrim" aria-hidden="true" />
    </>
  );
}
