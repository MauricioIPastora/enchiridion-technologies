export type ShapeTarget = "logo" | "diamond";

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/**
 * Mutable, tween-friendly state shared between GSAP ScrollTriggers and the
 * particle field's per-frame tick. (Same contract as the reference site.)
 */
export const particleScrollState = {
  shapeTarget: "logo" as ShapeTarget,
  geometryScale: { x: 1, y: 1, z: 1 } as Vec3Like,
  geometryPosition: { x: 0, y: 0, z: 0 } as Vec3Like,
  geometryRotation: { x: 0, y: 0, z: 0 } as Vec3Like,
  /** 0 = logo shape, 1 = diamond. */
  shapeMorph: 0,
  shapeMorphUseFlight: true,
  geometryScrollRotationY: 0,
  /** 0 = formed, 1 = scattered to spawn positions. */
  dissolve: 0,
  /** Footer formation progress (0..1). */
  rFormation: 0,
  pageDissolveOut: false,
};

export interface ParticleFieldHandle {
  regenerateSpawnLayout: () => void;
  reinitializeForRoute: () => void;
}

let activeField: ParticleFieldHandle | null = null;

export function registerParticleField(field: ParticleFieldHandle) {
  activeField = field;
}

export function unregisterParticleField(field: ParticleFieldHandle) {
  if (activeField === field) activeField = null;
}

export function regenerateParticleSpawnLayout() {
  activeField?.regenerateSpawnLayout();
}

export function reinitializeParticleFieldForRoute() {
  activeField?.reinitializeForRoute();
}

/* ------------------------------------------------------------------ */
/* data-geometry parsing                                               */
/* ------------------------------------------------------------------ */

export interface GeometryConfig {
  target: ShapeTarget;
  geometryScale: Vec3Like;
  geometryPosition: Vec3Like;
  geometryRotation: Vec3Like;
  entryAnimation: boolean;
  start: string;
  end: string;
  scrub: number;
  markers: boolean;
}

const ONE: Vec3Like = { x: 1, y: 1, z: 1 };
const ZERO: Vec3Like = { x: 0, y: 0, z: 0 };

function parseVec3(raw: string | undefined, fallback: Vec3Like): Vec3Like {
  if (raw === undefined || raw === "") return { ...fallback };
  const parts = String(raw)
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length === 1 && !Number.isNaN(parts[0])) {
    return { x: parts[0], y: parts[0], z: parts[0] };
  }
  if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
    return { x: parts[0], y: parts[1], z: parts[2] };
  }
  return { ...fallback };
}

function parseBool(raw: string | undefined) {
  return raw !== undefined && (raw === "true" || raw === "1");
}

export function isShapeTarget(v: unknown): v is ShapeTarget {
  return v === "logo" || v === "diamond";
}

export function isGeometryElement(el: Element | null | undefined) {
  return isShapeTarget((el as HTMLElement | null)?.dataset?.geometry);
}

export function readGeometryConfig(el: HTMLElement): GeometryConfig {
  const scrubRaw = el.dataset.geometryScrub;
  const scrub = scrubRaw !== undefined ? Number(scrubRaw) : 0.2;
  const geometry = el.dataset.geometry;
  const entry = el.dataset.geometryEntryAnimation;
  return {
    target: isShapeTarget(geometry) ? geometry : "logo",
    geometryScale: parseVec3(el.dataset.geometryScale, ONE),
    geometryPosition: parseVec3(el.dataset.geometryPosition, ZERO),
    geometryRotation: parseVec3(el.dataset.geometryRotation, ZERO),
    entryAnimation: entry === undefined || parseBool(entry),
    start: el.dataset.start ?? "top bottom",
    end: el.dataset.end ?? "top top",
    scrub: Number.isNaN(scrub) ? 0.2 : scrub,
    markers: parseBool(el.dataset.markers),
  };
}

export function queryGeometryElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-geometry]"));
}

export function shapeMorphFor(target: ShapeTarget) {
  return target === "diamond" ? 1 : 0;
}

export function copyVec3(dst: Vec3Like, src: Vec3Like) {
  dst.x = src.x;
  dst.y = src.y;
  dst.z = src.z;
}

export function vec3Equal(a: Vec3Like, b: Vec3Like) {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export function applyGeometryConfig(config: GeometryConfig) {
  particleScrollState.shapeTarget = config.target;
  particleScrollState.shapeMorph = shapeMorphFor(config.target);
  particleScrollState.shapeMorphUseFlight = config.entryAnimation;
  copyVec3(particleScrollState.geometryScale, config.geometryScale);
  copyVec3(particleScrollState.geometryPosition, config.geometryPosition);
  copyVec3(particleScrollState.geometryRotation, config.geometryRotation);
}

export function currentRouteShapeTarget(): ShapeTarget {
  const els = queryGeometryElements();
  return els.length > 0 ? readGeometryConfig(els[0]).target : "logo";
}

/* ------------------------------------------------------------------ */
/* data-dissolve parsing                                               */
/* ------------------------------------------------------------------ */

export interface DissolveConfig {
  start: string;
  end: string;
  scrub: number;
  markers: boolean;
}

const DISSOLVE_OUT_DEFAULTS = { start: "top bottom", end: "top center", scrub: 0.2 };
const DISSOLVE_IN_DEFAULTS = { start: "top bottom", end: "top top", scrub: 0.2 };

export function readDissolveConfig(el: HTMLElement, mode: "in" | "out"): DissolveConfig {
  const defaults = mode === "out" ? DISSOLVE_OUT_DEFAULTS : DISSOLVE_IN_DEFAULTS;
  const scrubRaw = el.dataset.dissolveScrub;
  const scrub = scrubRaw !== undefined ? Number(scrubRaw) : defaults.scrub;
  return {
    start: el.dataset.dissolveStart ?? defaults.start,
    end: el.dataset.dissolveEnd ?? defaults.end,
    scrub: Number.isNaN(scrub) ? defaults.scrub : scrub,
    markers: parseBool(el.dataset.markers),
  };
}

/** Dissolve-in config for a geometry section (uses data-start / data-end). */
export function readGeometryDissolveInConfig(el: HTMLElement): DissolveConfig {
  const base = readDissolveConfig(el, "in");
  const scrubRaw = el.dataset.dissolveScrub ?? el.dataset.geometryScrub;
  const scrub = scrubRaw !== undefined ? Number(scrubRaw) : base.scrub;
  return {
    start: el.dataset.start ?? base.start,
    end: el.dataset.end ?? base.end,
    scrub: Number.isNaN(scrub) ? base.scrub : scrub,
    markers: base.markers,
  };
}

export function queryDissolveElements(mode: "in" | "out"): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-dissolve="${mode}"]`));
}
