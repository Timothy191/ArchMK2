"use client";

import { useEffect, useRef, useState } from "react";

// Fallback SVG Wave helper functions and layers
function makeWavePath(
  y: number,
  amp: number,
  cp1x: number,
  cp2x: number,
  width = 1440,
  height = 320,
): string {
  const mid = width / 2;
  return `M0,${y} C${cp1x},${y - amp} ${cp2x},${y + amp} ${mid},${y} C${width - cp2x},${y - amp} ${width - cp1x},${y + amp} ${width},${y} L${width},${height} L0,${height} Z`;
}

interface WaveLayer {
  path: string;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
}

const WAVE_LAYERS: WaveLayer[] = [
  {
    path: makeWavePath(160, 80, 300, 500),
    color: "#e8e8ed",
    opacity: 0.35,
    duration: 32,
    delay: 0,
  },
  {
    path: makeWavePath(200, 60, 400, 600),
    color: "#d2d2d7",
    opacity: 0.3,
    duration: 24,
    delay: -4,
  },
  {
    path: makeWavePath(120, 100, 250, 550),
    color: "#e8e8ed",
    opacity: 0.25,
    duration: 28,
    delay: -8,
  },
  {
    path: makeWavePath(180, 50, 350, 650),
    color: "#d2d2d7",
    opacity: 0.2,
    duration: 20,
    delay: -2,
  },
  {
    path: makeWavePath(140, 40, 450, 750),
    color: "#ff9f0a",
    opacity: 0.015,
    duration: 36,
    delay: -10,
  },
];

// WebGL Shaders
const VS_SOURCE = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FS_SOURCE = `
  precision highp float;
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 bg_bottom;
  uniform vec3 bg_top;
  uniform vec3 ribbon_color;
  uniform float opacity_mult;

  // Organic simplex noise helper (macOS waves style)
  vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // Advanced sculptural ribbon with internal shading and sharp edges
  vec4 drawRibbon(vec2 uv, float freq, float amp, float speed, float offset, float thickness, float depthFactor) {
      float movement = time * speed + offset;
      float y = sin(uv.x * freq + movement) * amp;
      y += cos(uv.x * freq * 0.5 - movement * 0.3) * (amp * 0.2);

      float dist = uv.y - y;

      // Crisp, sharp boundary for the ribbon
      float mask = smoothstep(thickness, thickness * 0.98, abs(dist));
      if (mask <= 0.0) return vec4(0.0);

      // Internal sculptural shading (3D depth)
      float normDist = dist / thickness;

      // Nuanced internal gradient (the 'fold' effect)
      float fold = smoothstep(-1.0, 1.0, normDist);
      vec3 shadedColor = mix(ribbon_color * 0.3, ribbon_color * 1.3, fold);

      // Top edge 'silk' rim light
      float rimLight = pow(1.0 - abs(normDist - 0.4), 8.0) * 0.4;
      shadedColor += vec3(rimLight);

      // Deep core shadow for volume
      float coreShadow = pow(1.0 - abs(normDist + 0.2), 4.0) * 0.2;
      shadedColor -= vec3(coreShadow);

      return vec4(clamp(shadedColor, 0.0, 1.0), mask);
  }

  void main() {
      vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
      uv.x *= resolution.x / resolution.y;

      // Background: pristine gradient matching theme
      vec3 finalColor = mix(bg_bottom, bg_top, (uv.y + 1.0) * 0.5);

      // Layer ribbons from back to front with varying properties for depth
      // 1. Far background drift (Subtle, large)
      vec4 r1 = drawRibbon(uv, 0.3, 0.4, 0.05, 10.0, 0.18, 0.3);
      finalColor = mix(finalColor, r1.rgb, r1.a * opacity_mult);

      // 2. Midground sweep
      vec4 r2 = drawRibbon(uv, 0.7, 0.2, 0.12, 5.5, 0.14, 0.6);
      finalColor = mix(finalColor, r2.rgb, r2.a * opacity_mult);

      // 3. Counter-moving secondary ribbon
      vec4 r3 = drawRibbon(uv, 0.5, 0.3, -0.08, 2.2, 0.12, 0.4);
      finalColor = mix(finalColor, r3.rgb, r3.a * opacity_mult);

      // 4. Focal foreground ribbon (Thickest, most defined)
      vec4 r4 = drawRibbon(uv, 1.2, 0.15, 0.2, 0.0, 0.1, 1.0);
      finalColor = mix(finalColor, r4.rgb, r4.a * opacity_mult);

      // 5. Delicate accent ribbon
      vec4 r5 = drawRibbon(uv, 2.0, 0.08, 0.3, 8.8, 0.04, 0.8);
      finalColor = mix(finalColor, r5.rgb, r5.a * opacity_mult);

      // Soft vignette to anchor the composition (macOS aesthetic)
      float vignette = 1.0 - length(uv * 0.15);
      finalColor *= smoothstep(0.0, 1.0, vignette);

      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function getThemeColorVec3(
  variableName: string,
  defaultVal: [number, number, number],
): [number, number, number] {
  if (typeof window === "undefined") return defaultVal;
  try {
    const value = getComputedStyle(document.documentElement || document.body)
      .getPropertyValue(variableName)
      .trim();
    if (!value) return defaultVal;

    // Hex format (#ffffff)
    if (value.startsWith("#")) {
      const hex = value.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return [r, g, b];
    }

    // RGB / RGBA format (rgb(255, 255, 255))
    if (value.startsWith("rgb")) {
      const match = value.match(/\d+/g);
      if (match && match.length >= 3) {
        const rStr = match[0];
        const gStr = match[1];
        const bStr = match[2];
        if (rStr && gStr && bStr) {
          return [
            parseInt(rStr) / 255,
            parseInt(gStr) / 255,
            parseInt(bStr) / 255,
          ];
        }
      }
    }

    // HSL format (240 5% 96%)
    const parts = value.split(/\s+/);
    if (parts.length >= 3) {
      const p0 = parts[0];
      const p1 = parts[1];
      const p2 = parts[2];
      if (p0 && p1 && p2) {
        const h = parseFloat(p0);
        const s = parseFloat(p1.replace("%", "")) / 100;
        const l = parseFloat(p2.replace("%", "")) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) {
          r = c;
          g = x;
        } else if (h < 120) {
          r = x;
          g = c;
        } else if (h < 180) {
          g = c;
          b = x;
        } else if (h < 240) {
          g = x;
          b = c;
        } else if (h < 300) {
          r = x;
          g = b;
        } else {
          r = c;
          b = x;
        }
        return [r + m, g + m, b + m];
      }
    }
  } catch (e) {
    // Fallback to defaultVal on error
  }
  return defaultVal;
}

export function AnimatedWavesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Set up hydration and media query for prefers-reduced-motion
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // WebGL context and rendering cycle
  useEffect(() => {
    if (!mounted || reduceMotion || !webglSupported) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Helper functions for shader compilation
    function createShader(glContext: WebGLRenderingContext, type: number, source: string) {
      const shader = glContext.createShader(type);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);

    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    // Clean up shaders after linking
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Setup coordinates buffer (covering full viewport with two triangles)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, 1.0,
      1.0, 1.0,
      -1.0, -1.0,
      1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Fetch uniform locations
    const positionLocation = gl.getAttribLocation(program, "position");
    const timeLocation = gl.getUniformLocation(program, "time");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const bgBottomLocation = gl.getUniformLocation(program, "bg_bottom");
    const bgTopLocation = gl.getUniformLocation(program, "bg_top");
    const ribbonColorLocation = gl.getUniformLocation(program, "ribbon_color");
    const opacityMultLocation = gl.getUniformLocation(program, "opacity_mult");

    let animationFrameId: number;

    const resize = () => {
      if (!canvas) return;
      const displayWidth = window.innerWidth * window.devicePixelRatio;
      const displayHeight = window.innerHeight * window.devicePixelRatio;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener("resize", resize);
    resize();

    // Query theme colors
    const bgBottom = getThemeColorVec3("--bg-primary", [0.96078, 0.96078, 0.96863]);
    const bgTop = getThemeColorVec3("--bg-secondary", [1.0, 1.0, 1.0]);

    // Simple brightness metric: Y = 0.299R + 0.587G + 0.114B
    const brightness = bgBottom[0] * 0.299 + bgBottom[1] * 0.587 + bgBottom[2] * 0.114;
    const isDark = brightness < 0.5;

    // Use obsidian (near-black) ribbons on light backgrounds, light silk ribbons on dark backgrounds
    const ribbonColor = isDark ? [0.85, 0.85, 0.9] : [0.02, 0.02, 0.03];

    // Render loop
    const render = (now: number) => {
      const seconds = now * 0.001; // Convert to seconds

      gl.clearColor(bgBottom[0], bgBottom[1], bgBottom[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(timeLocation, seconds);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform3fv(bgBottomLocation, bgBottom);
      gl.uniform3fv(bgTopLocation, bgTop);
      gl.uniform3fv(ribbonColorLocation, ribbonColor);
      gl.uniform1f(opacityMultLocation, 0.7); // Subtle opacity for natural blend

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [mounted, reduceMotion, webglSupported]);

  // Handle SSR hydration placeholder
  if (!mounted) {
    return (
      <div
        className="fixed inset-0 z-0 bg-[var(--bg-primary)]"
        aria-hidden="true"
      />
    );
  }

  // Render SVG fallback if WebGL is not supported, or if user prefers reduced motion
  if (!webglSupported || reduceMotion) {
    return (
      <div
        className="fixed inset-0 z-0 overflow-hidden bg-[var(--bg-primary)]"
        aria-hidden="true"
      >
        {WAVE_LAYERS.map((layer, i) => (
          <div
            key={i}
            className="absolute left-0 top-0 w-[200%] h-full"
            style={{
              willChange: "transform",
              animation: reduceMotion
                ? "none"
                : `wave-drift ${layer.duration}s linear ${layer.delay}s infinite`,
              opacity: layer.opacity,
            }}
          >
            <svg
              viewBox="0 0 1440 320"
              className="w-1/2 h-full inline-block"
              preserveAspectRatio="none"
            >
              <path fill={layer.color} d={layer.path} />
            </svg>
            <svg
              viewBox="0 0 1440 320"
              className="w-1/2 h-full inline-block"
              preserveAspectRatio="none"
            >
              <path fill={layer.color} d={layer.path} />
            </svg>
          </div>
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 w-full h-full block bg-[var(--bg-primary)] pointer-events-none"
      aria-hidden="true"
    />
  );
}
