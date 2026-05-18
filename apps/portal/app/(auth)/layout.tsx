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
      }
    }
  }, []);

  const handleIntroComplete = () => {
    if (isFadingOut || !showIntroLayer) return;
    setIsFadingOut(true);
    setIntroComplete(true);
    setTimeout(() => {
      setShowIntroLayer(false);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-start p-6 lg:p-12 overflow-hidden bg-[#f3f4f6]">
      {/* GPU-Accelerated PS4-style Waves */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-slide-1 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes wave-slide-2 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes wave-slide-3 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes wave-float-1 {
          0% { transform: translate3d(0, -15px, 0) scaleY(0.95); }
          50% { transform: translate3d(0, 15px, 0) scaleY(1.05); }
          100% { transform: translate3d(0, -15px, 0) scaleY(0.95); }
        }
        @keyframes wave-float-2 {
          0% { transform: translate3d(0, 20px, 0) scaleY(1.08); }
          50% { transform: translate3d(0, -10px, 0) scaleY(0.92); }
          100% { transform: translate3d(0, 20px, 0) scaleY(1.08); }
        }
        @keyframes wave-float-3 {
          0% { transform: translate3d(0, -10px, 0) scaleY(1.02); }
          50% { transform: translate3d(0, 25px, 0) scaleY(0.96); }
          100% { transform: translate3d(0, -10px, 0) scaleY(1.02); }
        }
      `}} />

      {/* PS4 Ambient Waves Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10 bg-gradient-to-tr from-[#f0f2f5] via-[#f5f5f7] to-[#eef1f6]">
        {/* Subtle noise pattern for texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Wave 1: Indigo/Blue Base Wave */}
        <div 
          className="absolute inset-0 w-[200%] h-full origin-bottom"
          style={{
            animation: "wave-float-1 24s infinite ease-in-out",
            willChange: "transform",
          }}
        >
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 2400 300"
            preserveAspectRatio="none"
            style={{
              animation: "wave-slide-1 55s infinite linear",
              willChange: "transform",
            }}
          >
            <defs>
              <linearGradient id="grad-wave-1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#007aff" stopOpacity="0.14" />
                <stop offset="50%" stopColor="#5856d6" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#5856d6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path 
              d="M 0 120 Q 300 50, 600 120 T 1200 120 Q 1500 50, 1800 120 T 2400 120 L 2400 300 L 0 300 Z" 
              fill="url(#grad-wave-1)"
            />
          </svg>
        </div>

        {/* Wave 2: Emerald/Teal Intersecting Wave */}
        <div 
          className="absolute inset-0 w-[200%] h-full origin-bottom"
          style={{
            animation: "wave-float-2 18s infinite ease-in-out",
            willChange: "transform",
          }}
        >
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 2400 300"
            preserveAspectRatio="none"
            style={{
              animation: "wave-slide-2 38s infinite linear",
              willChange: "transform",
            }}
          >
            <defs>
              <linearGradient id="grad-wave-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34c759" stopOpacity="0.08" />
                <stop offset="50%" stopColor="#00c7be" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#007aff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path 
              d="M 0 160 Q 300 220, 600 160 T 1200 160 Q 1500 220, 1800 160 T 2400 160 L 2400 300 L 0 300 Z" 
              fill="url(#grad-wave-2)"
            />
          </svg>
        </div>

        {/* Wave 3: Cyan/Orange Ribbon Wave */}
        <div 
          className="absolute inset-0 w-[200%] h-full origin-bottom"
          style={{
            animation: "wave-float-3 28s infinite ease-in-out",
            willChange: "transform",
          }}
        >
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 2400 300"
            preserveAspectRatio="none"
            style={{
              animation: "wave-slide-3 65s infinite linear",
              willChange: "transform",
            }}
          >
            <defs>
              <linearGradient id="grad-wave-3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff9500" stopOpacity="0.06" />
                <stop offset="50%" stopColor="#ff2d55" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#007aff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path 
              d="M 0 100 Q 300 150, 600 100 T 1200 100 Q 1500 150, 1800 100 T 2400 100 L 2400 300 L 0 300 Z" 
              fill="url(#grad-wave-3)"
            />
          </svg>
        </div>
      </div>

      {/* Intro Video Layer */}
      {showIntroLayer && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-primary)] transition-opacity duration-[800ms] ease-out ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src="/intro.mp4" type="video/mp4" />
          </video>
          
          {/* Skip Button */}
          {videoLoaded && (
            <button
              onClick={handleIntroComplete}
              className="absolute bottom-12 right-12 z-[101] px-6 py-2 rounded-full border border-black/[0.10] bg-white/60 backdrop-blur-xl text-[var(--text-muted)] text-xs font-medium uppercase tracking-[0.2em] hover:bg-white/80 hover:text-[var(--text-heading)] transition-all shadow-diffusion-sm"
            >
              Skip Intro
            </button>
          )}
          
          {/* The video layer is now clean of loading text per user request */}
        </div>
      )}

      <div 
        className={`relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          introComplete 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8 pointer-events-none select-none'
        }`}
      >
        {children}
      </div>
    </div>
  );
}