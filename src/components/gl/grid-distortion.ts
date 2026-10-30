import * as THREE from "three";
import { CAROUSEL_CONFIG } from "@/components/gl/carousel-config";

export interface GridMouseState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vX: number;
  vY: number;
}

/** Low-res float texture that stores a UV offset field pushed around by the pointer. */
export function createGridDataTexture() {
  const size = CAROUSEL_CONFIG.GRID_SIZE;
  const data = new Float32Array(4 * size * size);
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
  tex.needsUpdate = true;
  return tex;
}

export function createGridMouseState(): GridMouseState {
  return { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
}

export function clearGridMouseVelocity(m: GridMouseState) {
  m.vX = 0;
  m.vY = 0;
}

export function updateGridMouseFromUv(m: GridMouseState, u: number, v: number) {
  m.vX = u - m.prevX;
  m.vY = v - m.prevY;
  m.x = u;
  m.y = v;
  m.prevX = u;
  m.prevY = v;
}

/** Relaxes the field and stamps the pointer velocity around its position. */
export function stepGridDistortion(tex: THREE.DataTexture, mouse: GridMouseState) {
  const { GRID_SIZE: size, GRID_MOUSE_RADIUS, GRID_STRENGTH, GRID_RELAXATION } = CAROUSEL_CONFIG;
  const data = tex.image.data as Float32Array;
  const total = size * size;
  for (let i = 0; i < total; i++) {
    data[4 * i] *= GRID_RELAXATION;
    data[4 * i + 1] *= GRID_RELAXATION;
  }
  const mx = size * mouse.x;
  const my = size * mouse.y;
  const radius = size * GRID_MOUSE_RADIUS;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const dx = mx - x;
      const dy = my - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < radius * radius && d2 > 0) {
        const idx = 4 * (x + size * y);
        const power = Math.min(radius / Math.sqrt(d2), 10);
        data[idx] += 100 * GRID_STRENGTH * mouse.vX * power;
        data[idx + 1] -= 100 * GRID_STRENGTH * mouse.vY * power;
      }
    }
  }
  mouse.vX = 0;
  mouse.vY = 0;
  tex.needsUpdate = true;
}
