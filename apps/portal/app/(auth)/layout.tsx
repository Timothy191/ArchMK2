"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[var(--bg-primary)]">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient with animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]" />
        
        {/* Animated overlay */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: "linear-gradient(135deg, rgba(62, 207, 142, 0.1) 0%, transparent 50%, rgba(0, 197, 115, 0.1) 100%)",
          }}
        />
        
        {/* Glow effects */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(62, 207, 142, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(62, 207, 142, 0.3) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        
        {/* Vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, #0a0a0a 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}