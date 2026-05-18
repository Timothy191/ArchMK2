"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./WebGLSilkWaves.module.css";

interface WebGLSilkWavesProps {
  className?: string;
}

export function WebGLSilkWaves({ className = "" }: WebGLSilkWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Vertex shader source
  const vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // Fragment shader source
  const fragmentShaderSource = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;

    // Refined wave function for premium, defined 3D fluid effects
    vec3 sculpturalWave(vec2 uv, float frequency, float amplitude, float speed, float offset, float thickness, vec3 color) {
      float y = sin(uv.x * frequency + time * speed + offset) * amplitude;
      float dist = uv.y - y;
      float absDist = abs(dist);
      
      // Sharpened ribbon mask for a crisper silhouette
      float ribbon = smoothstep(thickness, thickness * 0.9, absDist);
      
      // --- Enhanced Volumetric Shading ---
      
      // 1. Precise Razor Highlight (The "Edge" light)
      // High-contrast, very narrow highlight on the extreme edge for a silk-like sheen
      float razorHighlight = smoothstep(thickness * 0.02, 0.0, absDist - thickness * 0.8) * 0.8;
      
      // 2. Secondary Soft Glint (The "Top" surface)
      // Helps define the curvature of the ribbon
      float softGlint = smoothstep(thickness * 0.5, 0.0, absDist - thickness * 0.4) * 0.4;
      
      // 3. Deep Sculptural Core Shadow
      // Deepens the mid-tones to create volume. Higher power for smoother falloff.
      float shadowIntensity = pow(smoothstep(-thickness, thickness, dist), 1.5);
      float coreShadow = mix(0.2, 1.0, shadowIntensity);
      
      // 4. Enhanced Layer Separation Shadow (Drop Shadow)
      // Rich and distinct to define overlaps
      float dropShadow = smoothstep(thickness * 4.0, 0.0, abs(dist + thickness * 1.8)) * 0.6;

      // Combine components for a materialistic finish
      vec3 finalWave = color * coreShadow;
      
      // Apply highlights for the 3D pop
      finalWave += vec3(0.9) * razorHighlight;
      finalWave += vec3(0.5) * softGlint;
      
      // Apply the primary ribbon shape
      vec3 maskedWave = finalWave * ribbon;
      
      // Add the rich shadow contribution for depth against background/other layers
      vec3 shadowContribution = dropShadow * vec3(0.0) * 0.7;

      return maskedWave + shadowContribution;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
      uv.x *= resolution.x / resolution.y;

      // Pristine white background
      vec3 finalColor = vec3(1.0, 1.0, 1.0);

      // Premium high-contrast grayscale palette
      vec3 deepInk = vec3(0.02, 0.02, 0.03);
      vec3 charcoal = vec3(0.08, 0.08, 0.09);
      vec3 slate = vec3(0.15, 0.15, 0.17);

      // Layering with refined depth and distinct shadows
      
      // Layer 1: Distant Heavy Drift
      finalColor -= sculpturalWave(uv, 0.35, 0.32, 0.08, 4.5, 0.07, slate) * 0.4;

      // Layer 2: Main Structural Ribbon
      finalColor -= sculpturalWave(uv, 0.65, 0.2, 0.12, 0.0, 0.055, charcoal) * 0.7;

      // Layer 3: Dynamic Mid-ground
      finalColor -= sculpturalWave(uv, 1.2, 0.1, 0.22, 2.1, 0.04, deepInk) * 0.6;

      // Layer 4: Precise Foreground Stroke (Sharpest)
      finalColor -= sculpturalWave(uv, 1.9, 0.06, 0.3, 1.2, 0.025, charcoal) * 0.9;

      // Layer 5: Slow Counter-weight
      finalColor -= sculpturalWave(uv, 0.85, 0.28, -0.1, 3.0, 0.045, slate) * 0.5;

      // Subtle professional vignette
      float vignette = 1.0 - length(uv * 0.1);
      finalColor *= smoothstep(0.0, 1.1, vignette);

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
    }
  `;

  const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };

  const initWebGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.error("WebGL not supported");
      setIsSupported(false);
      return false;
    }

    const webglContext = gl as WebGLRenderingContext;
    glRef.current = webglContext;

    // Create shaders
    const vertexShader = createShader(webglContext, webglContext.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(webglContext, webglContext.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return false;

    // Create program
    const program = webglContext.createProgram();
    if (!program) return false;

    webglContext.attachShader(program, vertexShader);
    webglContext.attachShader(program, fragmentShader);
    webglContext.linkProgram(program);

    if (!webglContext.getProgramParameter(program, webglContext.LINK_STATUS)) {
      console.error("Program linking error:", webglContext.getProgramInfoLog(program));
      return false;
    }

    programRef.current = program;

    // Set up geometry
    const positionBuffer = webglContext.createBuffer();
    webglContext.bindBuffer(webglContext.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, 1.0,
      1.0, 1.0,
      -1.0, -1.0,
      1.0, -1.0,
    ];
    webglContext.bufferData(webglContext.ARRAY_BUFFER, new Float32Array(positions), webglContext.STATIC_DRAW);

    const positionLocation = webglContext.getAttribLocation(program, "position");
    webglContext.enableVertexAttribArray(positionLocation);
    webglContext.vertexAttribPointer(positionLocation, 2, webglContext.FLOAT, false, 0, 0);

    return true;
  };

  const resize = () => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const render = (now: number) => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const program = programRef.current;
    if (!canvas || !gl || !program) return;

    now *= 0.001; // Convert to seconds

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const timeLocation = gl.getUniformLocation(program, "time");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");

    gl.uniform1f(timeLocation, now);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationFrameRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    if (!initWebGL()) return;

    resize();
    window.addEventListener("resize", resize);

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Cleanup WebGL resources
      const gl = glRef.current;
      if (gl) {
        const program = programRef.current;
        if (program) {
          gl.deleteProgram(program);
        }
      }
    };
  }, []);

  if (!isSupported) {
    // Fallback to CSS gradient if WebGL is not supported
    return (
      <div 
        className={`${styles.webglContainer} ${styles.fallbackGradient} ${className}`}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.webglContainer} ${styles.canvas} ${className}`}
    />
  );
}
