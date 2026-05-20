"use client";

import { useState, useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [introComplete, setIntroComplete] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showIntroLayer, setShowIntroLayer] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isE2E =
        window.navigator.webdriver ||
        window.navigator.userAgent.toLowerCase().includes("playwright") ||
        window.location.search.includes("skipIntro=true") ||
        window.location.search.includes("redirect=");
      if (isE2E) {
        setIntroComplete(true);
        setShowIntroLayer(false);
        return;
      }

      const seenIntro = localStorage.getItem("arch:introSeen");
      if (seenIntro === "1") {
        setIntroComplete(true);
        setShowIntroLayer(false);
      }
    }
  }, []);

  const handleIntroComplete = () => {
    if (isFadingOut || !showIntroLayer) return;
    setIsFadingOut(true);
    setIntroComplete(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("arch:introSeen", "1");
    }
    setTimeout(() => {
      setShowIntroLayer(false);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-start p-6 lg:p-12 overflow-hidden bg-transparent">
      {/* Intro Video Layer */}
      {showIntroLayer && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-primary)] transition-opacity duration-[800ms] ease-out ${
            isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onTransitionEnd={() => {
            if (isFadingOut) {
              setShowIntroLayer(false);
            }
          }}
        >
          <video
            autoPlay
            muted
            playsInline
            onCanPlayThrough={() => setVideoLoaded(true)}
            onPlay={() => setVideoLoaded(true)}
            onEnded={handleIntroComplete}
            onError={handleIntroComplete}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <source src="/intro.mp4" type="video/mp4" />
          </video>

          {/* Skip Button */}
          {videoLoaded && (
            <button
              onClick={handleIntroComplete}
              className="absolute bottom-12 right-12 z-[101] px-6 py-2 rounded-full border border-[var(--border-emphasis)] bg-white/60 backdrop-blur-xl text-[var(--text-muted)] text-xs font-medium uppercase tracking-[0.2em] hover:bg-white/80 hover:text-[var(--text-heading)] transition-all shadow-diffusion-sm"
            >
              Skip Intro
            </button>
          )}

          {/* The video layer is now clean of loading text per user request */}
        </div>
      )}

      <div
        className={`relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          introComplete
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none select-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
