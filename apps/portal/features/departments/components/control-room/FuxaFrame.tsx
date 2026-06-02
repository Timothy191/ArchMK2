"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface FuxaFrameProps {
  dashboardId?: string;
  height?: string;
}

export function FuxaFrame({ dashboardId, height = "600px" }: FuxaFrameProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_FUXA_URL || "http://localhost:1881";
  const src = dashboardId ? `${baseUrl}/dashboard/${dashboardId}` : baseUrl;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setError(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [loading, key]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setKey((k) => k + 1);
  };

  return (
    <div
      className="glass rounded-xl overflow-hidden relative"
      style={{ height }}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="border-2 border-arch-accent-green border-t-transparent rounded-full animate-spin w-6 h-6" />
            <span className="text-sm text-[var(--text-secondary)]">
              Loading SCADA dashboard...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/90 backdrop-blur-xl z-20">
          <div className="max-w-sm w-full mx-4 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-accent-amber/10 border border-accent-amber/20">
                <AlertTriangle className="w-6 h-6 text-accent-amber" />
              </div>
            </div>
            <h3 className="text-[var(--text-heading)] font-medium">
              SCADA Unavailable
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              The FUXA SCADA server at{" "}
              <code className="text-xs bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                {baseUrl}
              </code>{" "}
              could not be reached.
            </p>
            <div className="rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] p-3 text-left">
              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Configuration
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Set{" "}
                <span className="font-mono text-[var(--accent-cyan)]">
                  NEXT_PUBLIC_FUXA_URL
                </span>{" "}
                in{" "}
                <code className="font-mono text-[var(--text-muted)]">
                  apps/portal/.env
                </code>{" "}
                to your FUXA instance.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-heading)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      )}

      <iframe
        id="fuxa-iframe"
        key={key}
        src={src}
        className="w-full h-full border-0"
        onLoad={() => {
          setLoading(false);
          setError(false);
          try {
            const iframe = document.getElementById(
              "fuxa-iframe",
            ) as HTMLIFrameElement;
            if (iframe && iframe.contentDocument) {
              const link = iframe.contentDocument.createElement("link");
              link.rel = "stylesheet";
              link.href = "/css/fuxa-light-theme.css";
              iframe.contentDocument.head.appendChild(link);
            }
          } catch {
            // Gracefully bypass cross-origin iframe security errors (e.g. local dev ports)
          }
        }}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        allow="autoplay; clipboard-read; clipboard-write"
        title="FUXA SCADA Dashboard"
      />
    </div>
  );
}
