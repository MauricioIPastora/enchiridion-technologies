import { PARTICLE } from "@/components/gl/particle-config";

export interface TangentFrame {
  t1x: number;
  t1y: number;
  t1z: number;
  t2x: number;
  t2y: number;
  t2z: number;
}

export interface SurfacePoint extends TangentFrame {
  x: number;
  y: number;
  z: number;
}

export interface ColoredPoint extends SurfacePoint {
  r: number;
  g: number;
  b: number;
}

/** Builds an orthonormal tangent frame around a normal. */
export function tangentFrame(nx: number, ny: number, nz: number): TangentFrame {
  const len = Math.hypot(nx, ny, nz) || 1;
  const x = nx / len;
  const y = ny / len;
  const z = nz / len;
  let ax = 0;
  let ay = 1;
  if (Math.abs(z) > 0.9) {
    ay = 0;
    ax = 1;
  }
  // t1 = cross(n, a) where a = (ax, ay, 0)
  let t1x = -z * ay;
  let t1y = z * ax;
  let t1z = x * ay - y * ax;
  const l1 = Math.hypot(t1x, t1y, t1z) || 1;
  t1x /= l1;
  t1y /= l1;
  t1z /= l1;
  const t2x = y * t1z - z * t1y;
  const t2y = z * t1x - x * t1z;
  const t2z = x * t1y - y * t1x;
  return { t1x, t1y, t1z, t2x, t2y, t2z };
}

/* ------------------------------------------------------------------ */
/* Image sampling (logo shape)                                         */
/* ------------------------------------------------------------------ */

let imageSamplesCache: Promise<ColoredPoint[]> | null = null;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Samples `count` particles from the opaque pixels of the logo image.
 * Positions are centred and normalised to ±SHAPE_HALF_EXTENT; each particle
 * keeps the pixel's colour and gets a little depth so the slab reads as 3D.
 */
export function sampleLogoImage(count: number): Promise<ColoredPoint[]> {
  if (!imageSamplesCache) {
    imageSamplesCache = loadImage(PARTICLE.SHAPE_IMAGE_URL).then((img) => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("2D context unavailable");
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      const opaque: number[] = [];
      for (let i = 0; i < size * size; i++) {
        if (data[i * 4 + 3] >= PARTICLE.SHAPE_ALPHA_THRESHOLD) opaque.push(i);
      }
      if (opaque.length === 0) throw new Error("Logo image has no opaque pixels");

      // Fit the opaque bounding box into the normalised extent.
      let minX = size;
      let minY = size;
      let maxX = 0;
      let maxY = 0;
      for (const idx of opaque) {
        const px = idx % size;
        const py = (idx - px) / size;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      const cx = (minX + maxX + 1) / 2;
      const cy = (minY + maxY + 1) / 2;
      const span = Math.max(maxX - minX + 1, maxY - minY + 1);
      const scale = (PARTICLE.SHAPE_HALF_EXTENT * 2) / span;

      const points: ColoredPoint[] = [];
      for (let i = 0; i < count; i++) {
        const idx = opaque[Math.floor(Math.random() * opaque.length)];
        const px = idx % size;
        const py = (idx - px) / size;
        const o = idx * 4;
        const r = data[o] / 255;
        const g = data[o + 1] / 255;
        const b = data[o + 2] / 255;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const jx = px + Math.random() - 0.5 + 0.5;
        const jy = py + Math.random() - 0.5 + 0.5;
        points.push({
          x: (jx - cx) * scale,
          y: -(jy - cy) * scale,
          z: (Math.random() - 0.5) * PARTICLE.SHAPE_DEPTH + (luma - 0.5) * PARTICLE.SHAPE_LUMA_DEPTH,
          t1x: 1,
          t1y: 0,
          t1z: 0,
          t2x: 0,
          t2y: 1,
          t2z: 0,
          r,
          g,
          b,
        });
      }
      return points;
    });
  }
  return imageSamplesCache.then((pts) => {
    if (pts.length >= count) return pts.slice(0, count);
    // Pad by re-sampling from the existing list.
    const out = pts.slice();
    while (out.length < count) out.push(pts[Math.floor(Math.random() * pts.length)]);
    return out;
  });
}

/* ------------------------------------------------------------------ */
/* Diamond mesh (morph target in the featured-work section)            */
/* ------------------------------------------------------------------ */

// prettier-ignore
const DIAMOND_VERTICES = new Float32Array([-2e-4, -3, 2e-4, -2e-4, -3, 2e-4, -2e-4, -3, 2e-4, -2e-4, -3, 2e-4, -.1251, -2.625, -.1251, -.1251, -2.625, .1251, .1251, -2.625, .1251, .1251, -2.625, -.1251, .25, -2.25, -.25, -.25, -2.25, -.25, -.25, -2.25, .25, .25, -2.25, .25, .3748, -1.8749, .3748, .3748, -1.8749, -.3748, -.3748, -1.8749, -.3748, -.3748, -1.8749, .3748, -.5001, -1.4999, .5001, .5001, -1.4999, .5001, .5001, -1.4999, -.5001, -.5001, -1.4999, -.5001, -.625, -1.1249, -.625, -.625, -1.1249, .625, .625, -1.1249, .625, .625, -1.1249, -.625, .7499, -.7499, -.7499, -.7499, -.7499, -.7499, -.7499, -.7499, .7499, .7499, -.7499, .7499, .8751, -.3748, .8751, .8751, -.3748, -.8751, -.8751, -.3748, -.8751, -.8751, -.3748, .8751, -1, 2e-4, 1, 1, 2e-4, 1, 1, 2e-4, -1, -1, 2e-4, -1, -.8751, .3748, -.8751, -.8751, .3748, .8751, .8751, .3748, .8751, .8751, .3748, -.8751, .7499, .7499, -.7499, -.7499, .7499, -.7499, -.7499, .7499, .7499, .7499, .7499, .7499, .625, 1.1249, .625, .625, 1.1249, -.625, -.625, 1.1249, -.625, -.625, 1.1249, .625, -.5001, 1.4999, .5001, .5001, 1.4999, .5001, .5001, 1.4999, -.5001, -.5001, 1.4999, -.5001, -.3748, 1.8749, -.3748, -.3748, 1.8749, .3748, .3748, 1.8749, .3748, .3748, 1.8749, -.3748, .25, 2.25, -.25, -.25, 2.25, -.25, -.25, 2.25, .25, .25, 2.25, .25, .1251, 2.625, .1251, .1251, 2.625, -.1251, -.1251, 2.625, -.1251, -.1251, 2.625, .1251, -2e-4, 3, 2e-4, -2e-4, 3, 2e-4]);

// prettier-ignore
const DIAMOND_INDICES = new Uint16Array([0, 1, 2, 3, 4, 5, 6, 5, 8, 8, 5, 9, 5, 4, 9, 9, 4, 10, 10, 4, 11, 4, 3, 11, 11, 3, 12, 12, 3, 13, 3, 5, 13, 14, 13, 16, 13, 5, 16, 5, 2, 16, 16, 2, 18, 18, 2, 19, 2, 1, 19, 19, 1, 20, 20, 1, 21, 1, 0, 21, 21, 0, 22, 23, 22, 25, 22, 0, 25, 0, 2, 25, 26, 25, 28, 29, 30, 31, 30, 32, 31, 32, 28, 31, 31, 28, 34, 28, 25, 34, 25, 2, 34, 2, 5, 34, 34, 5, 35, 5, 6, 35, 36, 35, 38, 35, 6, 38, 38, 6, 58, 58, 6, 39, 39, 6, 40, 6, 8, 40, 8, 9, 40, 9, 10, 40, 40, 10, 41, 10, 11, 41, 11, 12, 41, 41, 12, 42, 12, 13, 42, 13, 14, 42, 42, 14, 43, 14, 16, 62, 14, 62, 43, 16, 18, 63, 63, 18, 43, 18, 19, 43, 19, 20, 43, 43, 20, 44, 20, 21, 44, 21, 22, 44, 22, 23, 44, 44, 23, 45, 23, 25, 45, 25, 26, 45, 45, 26, 59, 45, 59, 46, 26, 28, 60, 60, 28, 46, 28, 32, 46, 46, 32, 47, 32, 30, 47, 47, 30, 48, 30, 29, 48, 48, 29, 49, 50, 49, 52, 49, 29, 52, 29, 31, 52, 31, 34, 52, 53, 52, 55, 52, 34, 55, 34, 35, 55, 55, 35, 56, 56, 35, 57, 35, 36, 57, 57, 36, 54, 54, 36, 51, 36, 38, 51, 51, 38, 37, 38, 61, 37, 61, 39, 37, 39, 40, 37, 37, 40, 27, 40, 41, 27, 41, 42, 27, 42, 43, 27, 43, 44, 27, 27, 44, 33, 44, 45, 33, 45, 46, 33, 46, 47, 33, 47, 48, 33, 48, 49, 33, 49, 50, 33, 33, 50, 24, 50, 52, 64, 50, 64, 24, 52, 53, 65, 65, 53, 24, 24, 53, 17, 53, 55, 17, 55, 56, 17, 17, 56, 15, 56, 57, 15, 57, 54, 15, 15, 54, 7, 54, 51, 7, 51, 37, 7, 37, 27, 7, 27, 33, 7, 33, 24, 7, 24, 17, 7, 15, 7, 17]);

interface Triangle {
  i0: number;
  i1: number;
  i2: number;
  area: number;
}

function triangleArea(v: Float32Array, a: number, b: number, c: number) {
  const ax = v[a * 3];
  const ay = v[a * 3 + 1];
  const az = v[a * 3 + 2];
  const ux = v[b * 3] - ax;
  const uy = v[b * 3 + 1] - ay;
  const uz = v[b * 3 + 2] - az;
  const wx = v[c * 3] - ax;
  const wy = v[c * 3 + 1] - ay;
  const wz = v[c * 3 + 2] - az;
  return 0.5 * Math.hypot(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx);
}

let diamondTriangles: { triangles: Triangle[]; totalArea: number } | null = null;

function getDiamondTriangles() {
  if (diamondTriangles) return diamondTriangles;
  const triangles: Triangle[] = [];
  let totalArea = 0;
  for (let t = 0; t < DIAMOND_INDICES.length / 3; t++) {
    const i0 = DIAMOND_INDICES[t * 3];
    const i1 = DIAMOND_INDICES[t * 3 + 1];
    const i2 = DIAMOND_INDICES[t * 3 + 2];
    const area = triangleArea(DIAMOND_VERTICES, i0, i1, i2);
    if (area <= 1e-10) continue;
    totalArea += area;
    triangles.push({ i0, i1, i2, area });
  }
  diamondTriangles = { triangles, totalArea };
  return diamondTriangles;
}

/** Uniform random points on the diamond surface (scaled to shape units). */
export function sampleDiamond(count: number): SurfacePoint[] {
  const { triangles, totalArea } = getDiamondTriangles();
  const v = DIAMOND_VERTICES;
  const s = PARTICLE.SHAPE_SCALE;
  const out: SurfacePoint[] = [];
  for (let n = 0; n < count; n++) {
    let pick = Math.random() * totalArea;
    let tri = triangles[triangles.length - 1];
    for (const t of triangles) {
      pick -= t.area;
      if (pick <= 0) {
        tri = t;
        break;
      }
    }
    let u = Math.random();
    let w = Math.random();
    if (u + w > 1) {
      u = 1 - u;
      w = 1 - w;
    }
    const k = 1 - u - w;
    const a = tri.i0 * 3;
    const b = tri.i1 * 3;
    const c = tri.i2 * 3;
    const x = (v[a] * k + v[b] * u + v[c] * w) * s;
    const y = (v[a + 1] * k + v[b + 1] * u + v[c + 1] * w) * s;
    const z = (v[a + 2] * k + v[b + 2] * u + v[c + 2] * w) * s;
    const e1x = v[b] - v[a];
    const e1y = v[b + 1] - v[a + 1];
    const e1z = v[b + 2] - v[a + 2];
    const e2x = v[c] - v[a];
    const e2y = v[c + 1] - v[a + 1];
    const e2z = v[c + 2] - v[a + 2];
    const frame = tangentFrame(e1y * e2z - e1z * e2y, e1z * e2x - e1x * e2z, e1x * e2y - e1y * e2x);
    out.push({ x, y, z, ...frame });
  }
  return out;
}
