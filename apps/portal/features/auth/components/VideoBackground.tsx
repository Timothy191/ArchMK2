"use client";

import { useEffect, useState } from "react";

export function VideoBackground() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = document.getElementById(
      "intro-video"
    ) as HTMLVideoElement | null;
    if (video) {
      video.play().then(() => setLoaded(true)).catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <video
        id="intro-video"
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-[#0f0f0f]/60" />
    </div>
  );
}