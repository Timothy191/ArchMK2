"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function LoginIntroOverlay() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showIntroLayer, setShowIntroLayer] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only skip for genuine automation — NOT for normal auth redirects.
      // The middleware always appends ?redirect=/ so we must NOT treat that
      // as a skip signal, otherwise the intro never plays.
      const isE2E =
        window.navigator.webdriver ||
        window.navigator.userAgent.toLowerCase().includes("playwright") ||
        window.location.search.includes("skipIntro=true");

      if (isE2E) {
        setShowIntroLayer(false);
        return;
      }

      // Skip within the same browser session (tab reloads / back-nav).
      // Key is scoped so clearing app storage resets it cleanly.
      const hasSeenIntro = sessionStorage.getItem("arch_introPlayed");
      if (hasSeenIntro) {
        setShowIntroLayer(false);
        return;
      }
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIsFadingOut((prevIsFadingOut) => {
      if (!prevIsFadingOut && typeof window !== "undefined") {
        sessionStorage.setItem("arch_introPlayed", "true");
      }
      return true;
    });
  }, []);

  // Fallback timeout to prevent stuck intro if video fails to load
  useEffect(() => {
    if (!showIntroLayer) return;
    const timeoutId = setTimeout(() => {
      if (!videoLoaded) {
        handleIntroComplete();
      }
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [videoLoaded, showIntroLayer, handleIntroComplete]);

  // Show skip button on video load, or after 1.5s regardless
  useEffect(() => {
    if (!showIntroLayer) return;
    const timeoutId = setTimeout(() => {
      setSkipVisible(true);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [showIntroLayer]);

  // Track video playback progress for the progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showIntroLayer) return;

    const updateProgress = () => {
      if (video.duration && !isNaN(video.duration)) {
        setProgress(video.currentTime / video.duration);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, [showIntroLayer, videoLoaded]);

  // Escape key to skip intro
  useEffect(() => {
    if (!showIntroLayer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleIntroComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntroLayer, handleIntroComplete]);

  if (!showIntroLayer) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-[800ms] ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onTransitionEnd={() => {
        if (isFadingOut) {
          setShowIntroLayer(false);
        }
      }}
    >
      {/* Transparent backdrop so the waves background shows through during fade-out */}
      <div className="absolute inset-0 bg-black/90" />

      {/* Loading / Logo State */}
      {!videoLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center animate-fade-in">
          <img
            src="/logo.png"
            alt="Arch"
            className="w-16 h-16 object-contain mb-6 opacity-80"
          />
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"
              style={{ animationDelay: "0.3s" }}
            />
          </div>
          <p className="mt-3 text-[11px] text-white/50 uppercase tracking-[0.2em] font-medium">
            Loading
          </p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlayThrough={() => setVideoLoaded(true)}
        onPlay={() => setVideoLoaded(true)}
        onEnded={handleIntroComplete}
        onError={handleIntroComplete}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* Bottom gradient for skip button legibility */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      {/* Skip Button + Keyboard hint */}
      <div
        className={`absolute bottom-12 right-12 z-[10000] flex items-center gap-3 transition-opacity duration-300 ${
          !(videoLoaded || skipVisible)
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <span className="text-[10px] text-white/40 uppercase tracking-[0.18em] font-medium animate-fade-in">
          Esc to skip
        </span>
        <button
          onClick={handleIntroComplete}
          className="px-6 py-2.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black/60 hover:border-white/40 transition-all duration-300 shadow-diffusion-sm animate-fade-in"
        >
          Skip Intro
        </button>
      </div>

      {/* Playback Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-[10000]">
        <div
          className="h-full bg-white/60 transition-all duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
