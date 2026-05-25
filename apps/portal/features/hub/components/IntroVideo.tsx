"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowRight, Info, Zap, Globe, Shield } from "lucide-react";

export function IntroVideo() {
  const [showLogin, setShowLogin] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // If autoplay fails, show login immediately
        setShowLogin(true);
      });
    }
  }, []);

  const handleVideoEnd = () => {
    // Add a small delay before showing login for smooth transition
    setTimeout(() => setShowLogin(true), 500);
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowLogin(true);
  };

  if (!showLogin) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          className="w-full h-full object-cover"
        />
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Skip Intro
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background image with light overlay */}
      <Image
        src="/arch_logo_background.png"
        alt=""
        fill
        priority
        className="object-cover opacity-[0.08]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/50 to-arch-accent-blue/5 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 px-6">
        {/* Badge */}
        <div className="flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-arch-accent-green/10 border border-arch-accent-green/20 text-arch-accent-green text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-arch-accent-green animate-pulse" />
            System Online
          </span>
          <span className="text-xs font-mono text-arch-text-tertiary tracking-wider">
            PORTAL v1.5.1
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-arch-text-primary">
            Arch Operations
          </h1>
          <p className="text-arch-text-secondary text-lg leading-relaxed max-w-xl mx-auto">
            Centralized monitoring and control for Plantcor industrial
            complexes. Real-time telemetry, incident tracking, and
            multi-department oversight.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-arch-accent-blue hover:bg-accent-blue text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-diffusion-sm min-h-[48px]"
          >
            <Lock className="w-4 h-4" />
            Sign In to Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-arch-surface-secondary/70 hover:bg-arch-surface-secondary border border-arch-border-primary/50 text-arch-text-secondary font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm min-h-[48px]"
          >
            <Info className="w-4 h-4" />
            System Guidelines
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {[
            { icon: Zap, label: "Real-time Telemetry" },
            { icon: Globe, label: "Multi-Sector Control" },
            { icon: Shield, label: "Safety Compliance" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arch-surface-secondary/60 border border-arch-border-subtle text-arch-text-secondary text-xs font-medium"
            >
              <Icon className="w-3.5 h-3.5 text-arch-accent-blue" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
