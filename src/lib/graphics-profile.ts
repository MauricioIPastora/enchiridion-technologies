export interface GraphicsProfile {
  tier: "high" | "medium" | "low";
  dpr: number;
  /** Particles used for the logo geometry (hero / footer). */
  particleCount: number;
  particleTwinklePercent: number;
  particleTwinkleIntensity: number;
  /** Background starfield particles. */
  shaderParticleCount: number;
  enableBloom: boolean;
  fboScale: number;
  antialias: boolean;
  maxFps: number;
}

const high: GraphicsProfile = {
  tier: "high",
  dpr: 2,
  particleCount: 14000,
  particleTwinklePercent: 40,
  particleTwinkleIntensity: 3.5,
  shaderParticleCount: 10000,
  enableBloom: true,
  fboScale: 1,
  antialias: false,
  maxFps: 60,
};

const medium: GraphicsProfile = {
  tier: "medium",
  dpr: 1.5,
  particleCount: 9000,
  particleTwinklePercent: 20,
  particleTwinkleIntensity: 1.8,
  shaderParticleCount: 6000,
  enableBloom: true,
  fboScale: 0.85,
  antialias: false,
  maxFps: 60,
};

const low: GraphicsProfile = {
  tier: "low",
  dpr: 1,
  particleCount: 5000,
  particleTwinklePercent: 0,
  particleTwinkleIntensity: 0,
  shaderParticleCount: 3000,
  enableBloom: false,
  fboScale: 0.7,
  antialias: false,
  maxFps: 30,
};

let cached: GraphicsProfile | null = null;

export function getGraphicsProfile(): GraphicsProfile {
  if (cached) return cached;
  if (typeof window === "undefined") return high;
  const tier = (() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const mem = nav.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const dpr = window.devicePixelRatio || 1;
    if (
      coarse ||
      (typeof mem === "number" && mem <= 4) ||
      (typeof cores === "number" && cores <= 4 && dpr >= 2)
    ) {
      return "medium";
    }
    return "high";
  })();
  cached = tier === "low" ? low : tier === "medium" ? medium : high;
  return cached;
}
