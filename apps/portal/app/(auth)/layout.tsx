"use client";

import { useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <div className="relative min-h-screen flex items-center p-6 lg:p-12 overflow-hidden">
      {/* Intro Video - plays once then fades */}
      {!introComplete && (
        <div 
          className={`fixed inset-0 z-50 transition-opacity duration-1000 ${introComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <video
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onEnded={() => setIntroComplete(true)}
          >
            <source src="/intro.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* Content-specific overlays can stay here if they are only for auth, but the video should be gone */}
      <div className={`fixed inset-0 -z-10 transition-opacity duration-1000 ${introComplete ? 'opacity-100' : 'opacity-0'}`}>
        {/* We keep the overlays that are specific to the auth aesthetic if needed, 
            but since GlobalBackground handles them now, we can simplify this. */}
      </div>

      {/* Left-aligned content container - fades in after intro */}
      <div className={`relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto transition-all duration-1000 ${introComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {children}
      </div>
    </div>
  );
}