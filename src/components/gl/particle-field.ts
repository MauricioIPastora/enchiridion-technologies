import * as THREE from "three";
import { PARTICLE } from "@/components/gl/particle-config";
import { particleScrollState } from "@/components/gl/particle-state";
import { geometryParticleFragment, geometryParticleVertex } from "@/components/gl/shaders";
import { sampleDiamond, sampleLogoImage, type ColoredPoint, type SurfacePoint } from "@/components/gl/shape-sampling";

const DEG = Math.PI / 180;

export interface PointerInfo {
  engagement: number;
  active: boolean;
  speed: number;
  localSmoothX: number;
  localSmoothY: number;
}

interface Particle {
  // footer formation target (the logo again)
  anchorX: number;
  anchorY: number;
  anchorZ: number;
  // hero shape (logo, carries the image colour) + diamond morph target
  shape: ColoredPoint;
  diamond: SurfacePoint;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  formDelay: number;
  dissolveDelay: number;
  x: number;
  y: number;
  z: number;
  opacity: number;
  offX: number;
  offY: number;
  phase: number;
  noisePhase: number;
  twinkle: number;
  morphPhase: number;
  morphSpeed: number;
  morphDrift: number;
  morphKick: number;
  morphKickX: number;
  morphKickY: number;
  morphKickZ: number;
  hasTwinkle: boolean;
  twinklePhase: number;
  twinkleSpeed: number;
  baseSize: number;
  shapeDist: number;
  anchorDist: number;
}

export interface ParticleField {
  points: THREE.Points;
  setScale: (scale: number, width?: number, height?: number) => void;
  setSpawnLayout: (width: number, height: number) => void;
  tick: (dt: number, pointer: PointerInfo | null) => void;
  reinitializeForRoute: () => void;
  regenerateSpawnLayout: () => void;
  dispose: () => void;
}

interface FieldOptions {
  twinklePercent?: number;
  twinkleIntensity?: number;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function staggered(delay: number, progress: number) {
  if (progress <= delay) return 0;
  const span = 1 - delay;
  return span <= 1e-6 ? 1 : Math.min(1, (progress - delay) / span);
}

function dissolveProgress(delay: number, dissolve: number) {
  return staggered(delay, dissolve);
}

function rotateForDissolve(x: number, y: number, z: number, t: number) {
  const angle = t * PARTICLE.DISSOLVE_ROTATION_DEGREES * DEG;
  if (Math.abs(angle) < 1e-8) return { x, y, z };
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  switch (PARTICLE.DISSOLVE_ROTATION_AXIS) {
    case "x":
      return { x, y: y * c - z * s, z: y * s + z * c };
    case "y":
      return { x: x * c + z * s, y, z: -x * s + z * c };
    default:
      return { x: x * c - y * s, y: x * s + y * c, z };
  }
}

function rotateY(x: number, y: number, z: number, angle: number) {
  if (Math.abs(angle) < 1e-8) return { x, y, z };
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c + z * s, y, z: -x * s + z * c };
}

function morphCommit(t: number, start = PARTICLE.SHAPE_MORPH_COMMIT_START) {
  if (t <= start) return 0;
  const r = (t - start) / (1 - start);
  return r * r * (3 - 2 * r);
}

function morphRandomOffset(time: number, p: Particle, strength: number) {
  if (strength <= 0.001) return { x: 0, y: 0, z: 0 };
  const amount = PARTICLE.SHAPE_MORPH_RANDOM_AMOUNT * p.morphDrift * strength;
  const s = time * p.morphSpeed * PARTICLE.SHAPE_MORPH_RANDOM_SPEED;
  const a = p.morphPhase;
  const k = p.morphKick;
  const nx = Math.sin(1.2 * s + a) + 0.5 * Math.sin(2.1 * s + 1.7 * a) + 0.28 * Math.sin(3.3 * s + 2.4 * a);
  const ny = Math.cos(0.9 * s + 1.3 * a) + 0.45 * Math.sin(1.8 * s + a) + 0.22 * Math.cos(2.6 * s + 1.9 * a);
  const nz = 0.55 * Math.sin(1.5 * s + 2.2 * a) + 0.35 * Math.cos(2.4 * s + 0.8 * a);
  return {
    x: (nx / 2.15 + p.morphKickX * k) * amount,
    y: (ny / 2.15 + p.morphKickY * k) * amount,
    z: (nz / 2.15 + p.morphKickZ * k) * amount,
  };
}

/** Logo → diamond morph with the "flight" (expand, spin, scatter, commit). */
function morphPoint(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  t: number,
  p: Particle,
  time: number,
  useFlight: boolean,
) {
  if (t <= 0) return { x: from.x, y: from.y, z: from.z };
  if (t >= 1) return { x: to.x, y: to.y, z: to.z };
  if (!useFlight) {
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t };
  }
  const expand = 1 + PARTICLE.SHAPE_MORPH_EXPAND * Math.sin(t * Math.PI);
  const angle = t * PARTICLE.SHAPE_MORPH_ROTATION_DEGREES * DEG;
  const commit = morphCommit(t);
  const chaos = Math.sin(t * Math.PI) * (1 - commit);
  let { x, y, z } = rotateY(from.x * expand, from.y * expand, from.z * expand, angle);
  const r = morphRandomOffset(time, p, chaos);
  x += r.x;
  y += r.y;
  z += r.z;
  return { x: x + (to.x - x) * commit, y: y + (to.y - y) * commit, z: z + (to.z - z) * commit };
}

function twinkleValue(p: Particle, time: number) {
  if (!p.hasTwinkle) return 0;
  const r = time * p.twinkleSpeed + p.twinklePhase;
  const v = (0.5 * Math.sin(r) + 0.32 * Math.sin(2.17 * r + p.phase) + 0.18 * Math.sin(4.83 * r + p.noisePhase) + 1) * 0.5;
  return Math.pow(Math.max(0, v), 2.6);
}

function assignTwinkle(particles: Particle[], percent: number) {
  const n = Math.max(0, Math.min(particles.length, Math.round((particles.length * Math.max(0, percent)) / 100)));
  const idx = particles.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  for (const p of particles) p.hasTwinkle = false;
  for (let i = 0; i < n; i++) {
    const p = particles[idx[i]];
    p.hasTwinkle = true;
    p.twinklePhase = Math.random() * Math.PI * 2;
    p.twinkleSpeed = 0.85 + 2.2 * Math.random();
  }
}

/**
 * Loads the logo image and builds the particle field.
 */
export async function createParticleField(count: number, options: FieldOptions = {}): Promise<ParticleField> {
  const { twinklePercent = PARTICLE.TWINKLE_PERCENT, twinkleIntensity = PARTICLE.TWINKLE_INTENSITY } = options;
  const samples: ColoredPoint[] = await sampleLogoImage(count);
  const diamondPoints = sampleDiamond(samples.length);

  const particles: Particle[] = samples.map((s, i) => ({
    anchorX: s.x,
    anchorY: s.y,
    anchorZ: s.z,
    shape: s,
    diamond: diamondPoints[i],
    spawnX: 0,
    spawnY: 0,
    spawnZ: 0,
    formDelay: 0,
    dissolveDelay: 0,
    x: 0,
    y: 0,
    z: 0,
    opacity: 0,
    offX: 0,
    offY: 0,
    phase: Math.random() * Math.PI * 2,
    noisePhase: Math.random() * Math.PI * 2,
    twinkle: 0.35 + 0.65 * Math.random(),
    morphPhase: Math.random() * Math.PI * 2,
    morphSpeed: 0.75 + 0.9 * Math.random(),
    morphDrift: 0.55 + 0.9 * Math.random(),
    morphKick: 0.35 + 0.65 * Math.random(),
    morphKickX: (Math.random() - 0.5) * 2,
    morphKickY: (Math.random() - 0.5) * 2,
    morphKickZ: (Math.random() - 0.5) * 1.4,
    hasTwinkle: false,
    twinklePhase: 0,
    twinkleSpeed: 1,
    baseSize:
      PARTICLE.PARTICLE_SIZE_MIN + (PARTICLE.PARTICLE_SIZE_MAX - PARTICLE.PARTICLE_SIZE_MIN) * Math.random() * 0.32,
    shapeDist: 0,
    anchorDist: 0,
  }));

  let maxShapeDist = 1e-8;
  let maxAnchorDist = 1e-8;
  for (const p of particles) {
    p.shapeDist = Math.hypot(p.shape.x, p.shape.y, p.shape.z);
    p.anchorDist = Math.hypot(p.anchorX, p.anchorY, p.anchorZ);
    maxShapeDist = Math.max(maxShapeDist, p.shapeDist);
    maxAnchorDist = Math.max(maxAnchorDist, p.anchorDist);
  }
  for (const p of particles) {
    p.dissolveDelay = (1 - p.shapeDist / maxShapeDist) * PARTICLE.DISSOLVE_STAGGER;
    p.formDelay = (p.anchorDist / maxAnchorDist) * PARTICLE.FORM_STAGGER;
  }
  assignTwinkle(particles, twinklePercent);

  let scale = 1;
  let viewportW = 0;
  let viewportH = 0;
  let time = 0;
  const n = particles.length;
  const positions = new Float32Array(3 * n);
  const colors = new Float32Array(3 * n);
  const sizes = new Float32Array(n);
  const brightness = new Float32Array(n);
  const opacities = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const p = particles[i];
    positions[i * 3] = p.x * scale;
    positions[i * 3 + 1] = p.y * scale;
    positions[i * 3 + 2] = p.z * scale;
    colors[i * 3] = p.shape.r;
    colors[i * 3 + 1] = p.shape.g;
    colors[i * 3 + 2] = p.shape.b;
    sizes[i] = p.baseSize;
    brightness[i] = 0.92;
    opacities[i] = p.opacity;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("brightness", new THREE.BufferAttribute(brightness, 1));
  geometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: geometryParticleVertex,
    fragmentShader: geometryParticleFragment,
    uniforms: {
      uSizeRef: { value: PARTICLE.DEPTH_SIZE_REF },
      uLocalZExtent: { value: PARTICLE.PARTICLE_Z_RANGE },
      uZAlphaMin: { value: PARTICLE.PARTICLE_Z_ALPHA_MIN },
      uZAlphaMax: { value: PARTICLE.PARTICLE_Z_ALPHA_MAX },
      uGlowBoost: { value: PARTICLE.GLOW_BOOST },
      uHaloStrength: { value: PARTICLE.HALO_STRENGTH },
      uColorGainBase: { value: PARTICLE.COLOR_GAIN_BASE },
      uColorGainBrightness: { value: PARTICLE.COLOR_GAIN_BRIGHTNESS },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 1;

  function updateZExtent() {
    material.uniforms.uLocalZExtent.value = PARTICLE.PARTICLE_Z_RANGE * Math.max(scale, 1);
  }

  function writePositions() {
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      positions[i * 3] = p.x * scale + p.offX;
      positions[i * 3 + 1] = p.y * scale + p.offY;
      positions[i * 3 + 2] = p.z * scale;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  function setSpawnLayout(width: number, height: number) {
    if (!scale || n === 0 || width <= 0 || height <= 0) return;
    viewportW = width;
    viewportH = height;
    const spread = PARTICLE.SPAWN_SPREAD * PARTICLE.SPAWN_DISTANCE_MULTIPLIER;
    const halfW = (width / scale) * 0.5 * spread;
    const halfH = (height / scale) * 0.5 * spread;
    const halfZ = 1.4 * PARTICLE.PARTICLE_Z_RANGE * PARTICLE.SPAWN_DISTANCE_MULTIPLIER;
    const formation = particleScrollState.rFormation;
    for (const p of particles) {
      p.spawnX = (Math.random() - 0.5) * halfW * 2;
      p.spawnY = (Math.random() - 0.5) * halfH * 2;
      p.spawnZ = (Math.random() - 0.5) * halfZ * 2;
      if (formation > 0.001 && formation < 0.999) {
        p.x = p.spawnX;
        p.y = p.spawnY;
        p.z = p.spawnZ;
        p.opacity = 0;
      }
    }
    if (formation > 0.001 && formation < 0.999) {
      for (let i = 0; i < n; i++) opacities[i] = particles[i].opacity;
      writePositions();
      geometry.attributes.opacity.needsUpdate = true;
    }
  }

  function repelFromPointer(p: Particle, px: number, py: number, dt: number, strength: number) {
    const decay = 1 - Math.exp(-5.2 * dt);
    p.offX += -p.offX * decay;
    p.offY += -p.offY * decay;
    if (Math.abs(p.offX) < 0.02) p.offX = 0;
    if (Math.abs(p.offY) < 0.02) p.offY = 0;
    if (strength <= 0.02) return;
    const sx = p.x * scale + p.offX;
    const sy = p.y * scale + p.offY;
    const dx = px - sx;
    const dy = py - sy;
    const d2 = dx * dx + dy * dy;
    const radius = PARTICLE.CURSOR_RADIUS;
    if (d2 >= radius * radius) return;
    const d = Math.sqrt(d2) || 1e-4;
    const falloff = 1 - d / radius;
    const force = falloff * falloff * PARTICLE.CURSOR_FORCE * strength * dt * 60;
    p.offX -= (dx / d) * force;
    p.offY -= (dy / d) * force;
  }

  function tick(dtRaw = 1 / 60, pointer: PointerInfo | null = null) {
    if (n === 0) return;
    const dt = Math.min(Math.max(dtRaw, 0.001), 0.05);
    time += dt;
    const { dissolve, rFormation, shapeMorph, shapeMorphUseFlight, pageDissolveOut } = particleScrollState;
    updateZExtent();
    const morph = shapeMorph ?? 0;
    const useFlight = shapeMorphUseFlight !== false;
    const forming = rFormation > 0.001;
    const engagement = pointer?.engagement ?? 0;
    const active = pointer?.active ?? false;
    const px = pointer?.localSmoothX ?? 0;
    const py = pointer?.localSmoothY ?? 0;
    const interacting = engagement > 0.02 || active;
    const strength = engagement * (interacting ? Math.min(1, (pointer?.speed ?? 0) / 90) : 0);

    for (let i = 0; i < n; i++) {
      const p = particles[i];
      const flicker = Math.sin(time * (1.1 + p.twinkle) + p.phase);
      let opacityMul = 1;
      let brightMul = 1;
      let sizeMul = 1;

      if (forming) {
        const f = easeOutCubic(staggered(p.formDelay, rFormation));
        let x = p.spawnX + (p.anchorX - p.spawnX) * f;
        let y = p.spawnY + (p.anchorY - p.spawnY) * f;
        let z = p.spawnZ + (p.anchorZ - p.spawnZ) * f;
        if (dissolve <= 0.001) ({ x, y, z } = rotateForDissolve(x, y, z, f));
        opacityMul = f;
        brightMul = f;
        sizeMul = f;
        if (dissolve > 0.001 && (rFormation >= 0.999 || pageDissolveOut)) {
          const e = easeOutCubic(dissolveProgress(p.dissolveDelay, dissolve));
          x += (p.spawnX - x) * e;
          y += (p.spawnY - y) * e;
          z += (p.spawnZ - z) * e;
          ({ x, y, z } = rotateForDissolve(x, y, z, e));
          opacityMul *= 1 - e;
          brightMul *= 1 - 0.85 * e;
          sizeMul *= 1 - e;
        }
        p.x = x;
        p.y = y;
        p.z = z;
      } else {
        const target = morphPoint(p.shape, p.diamond, morph, p, time, useFlight);
        const a = easeOutCubic(dissolveProgress(p.dissolveDelay, dissolve));
        let x = target.x + (p.spawnX - target.x) * a;
        let y = target.y + (p.spawnY - target.y) * a;
        let z = target.z + (p.spawnZ - target.z) * a;
        ({ x, y, z } = rotateForDissolve(x, y, z, a));
        p.x = x;
        p.y = y;
        p.z = z;
        opacityMul = 1 - a;
        brightMul = 1 - 0.85 * a;
        sizeMul = 1 - a;
      }

      if (interacting || p.offX !== 0 || p.offY !== 0) repelFromPointer(p, px, py, dt, strength);

      positions[i * 3] = p.x * scale + p.offX;
      positions[i * 3 + 1] = p.y * scale + p.offY;
      positions[i * 3 + 2] = p.z * scale;
      opacities[i] = opacityMul;
      sizes[i] = p.baseSize * sizeMul;
      const visible = Math.max(brightMul, forming ? rFormation : 1);
      const tw = twinkleValue(p, time) * twinkleIntensity * visible;
      const base = p.hasTwinkle ? 0 : 0.1 * flicker * visible;
      brightness[i] = 1.05 + base + tw;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.brightness.needsUpdate = true;
    geometry.attributes.opacity.needsUpdate = true;
  }

  return {
    points,
    setScale(nextScale, width = viewportW, height = viewportH) {
      scale = nextScale;
      updateZExtent();
      if (width > 0 && height > 0) setSpawnLayout(width, height);
      else writePositions();
    },
    setSpawnLayout,
    tick,
    reinitializeForRoute() {
      for (const p of particles) {
        p.offX = 0;
        p.offY = 0;
      }
      if (viewportW > 0 && viewportH > 0) setSpawnLayout(viewportW, viewportH);
      tick(0);
    },
    regenerateSpawnLayout() {
      if (viewportW > 0 && viewportH > 0) setSpawnLayout(viewportW, viewportH);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
