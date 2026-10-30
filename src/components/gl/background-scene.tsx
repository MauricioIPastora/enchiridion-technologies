"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { gsap } from "@/lib/gsap";
import { registerTickerCallback } from "@/lib/ticker";
import { useScrollStore } from "@/stores/scroll-store";
import { BACKGROUND } from "@/components/gl/particle-config";
import {
  compositeFragment,
  gradientFragment,
  gradientVertex,
  screenVertex,
  starFragment,
  starVertex,
  trailFragment,
} from "@/components/gl/shaders";

/* ------------------------------------------------------------------ */
/* Starfield                                                           */
/* ------------------------------------------------------------------ */

const STARS = {
  fov: 55,
  sizeMin: 0.55,
  sizeMax: 1.65,
  spawnFarMin: 900,
  spawnFarMax: 2400,
  despawnZ: 80,
  speedMin: 40,
  speedMax: 520,
  sizeRef: 520,
  brightSizeMul: 1.42,
  brightLevel: 2.05,
  dimLevel: 0.68,
  xySpread: 1.05,
  cursorRadius: 220,
  bulgeStrength: 42,
  cursorDepthRef: 450,
  cursorFarMinRatio: 0.21,
  cursorReturnSpeed: 3.2,
};

interface Star {
  x: number;
  y: number;
  z: number;
  originX: number;
  originY: number;
  offX: number;
  offY: number;
  baseSize: number;
  sparkle: boolean;
  speed: number;
}

interface PointerState {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  uv: { x: number; y: number };
  uvPrev: { x: number; y: number };
  uvSmooth: { x: number; y: number };
  uvSmoothPrev: { x: number; y: number };
  uvVel: { x: number; y: number };
  speed: number;
  engagement: number;
  vfxEngage: number;
  disengageProgress: number;
  scrollDirection: number;
  scrollSpeed: number;
  scrollBoost: number;
  scrollGradientBoost: number;
}

function randomSpeed() {
  return STARS.speedMin * Math.pow(STARS.speedMax / STARS.speedMin, Math.random());
}

function frustumHalfExtents(z: number, aspect: number) {
  const halfH = Math.tan((STARS.fov * Math.PI) / 180 / 2) * Math.abs(z);
  return { halfW: halfH * aspect, halfH };
}

function spawnStar(sparkle: boolean, aspect: number, respawn = false): Star {
  const range = STARS.spawnFarMax - STARS.spawnFarMin;
  const z = respawn
    ? -(STARS.spawnFarMax - Math.random() * range * 0.4)
    : -(STARS.spawnFarMin + Math.random() * range);
  const { halfW, halfH } = frustumHalfExtents(z, aspect);
  const x = (Math.random() - 0.5) * halfW * 2 * STARS.xySpread;
  const y = (Math.random() - 0.5) * halfH * 2 * STARS.xySpread;
  return {
    x,
    y,
    z,
    originX: x,
    originY: y,
    offX: 0,
    offY: 0,
    baseSize: STARS.sizeMin + Math.random() * (STARS.sizeMax - STARS.sizeMin),
    sparkle,
    speed: randomSpeed(),
  };
}

function createStarfield(pointer: PointerState, count: number) {
  let aspect = 1;
  let stars: Star[] = [];
  let positions: Float32Array | null = null;
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    uniforms: {
      uSizeRef: { value: STARS.sizeRef },
      uSpawnFar: { value: STARS.spawnFarMax },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 1;

  function returnToOrigin(s: Star, dt: number) {
    const k = 1 - Math.exp(-STARS.cursorReturnSpeed * dt);
    s.offX += -s.offX * k;
    s.offY += -s.offY * k;
    if (Math.abs(s.offX) < 0.004) s.offX = 0;
    if (Math.abs(s.offY) < 0.004) s.offY = 0;
    s.x = s.originX + s.offX;
    s.y = s.originY + s.offY;
  }

  return {
    points,
    resize(width: number, height: number) {
      aspect = Math.max(width / Math.max(height, 1), 0.01);
      const brightCount = Math.floor(0.2 * count);
      const flags = Array.from({ length: count }, (_, i) => i < brightCount);
      for (let i = flags.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flags[i], flags[j]] = [flags[j], flags[i]];
      }
      stars = flags.map((sparkle) => spawnStar(sparkle, aspect, false));
      const n = stars.length;
      positions = new Float32Array(3 * n);
      const colors = new Float32Array(3 * n);
      const sizes = new Float32Array(n);
      const brightness = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const s = stars[i];
        positions[i * 3] = s.x;
        positions[i * 3 + 1] = s.y;
        positions[i * 3 + 2] = s.z;
        colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 1;
        sizes[i] = s.sparkle ? s.baseSize * STARS.brightSizeMul : s.baseSize;
        brightness[i] = s.sparkle ? STARS.brightLevel : STARS.dimLevel;
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("brightness", new THREE.BufferAttribute(brightness, 1));
    },
    tick(dtRaw = 1 / 60) {
      if (!positions || stars.length === 0) return;
      const dt = Math.min(Math.max(dtRaw, 0.001), 0.05);
      const engage = Math.max(pointer.engagement, 0.92 * pointer.vfxEngage);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z += s.speed * pointer.scrollBoost * dt;
        if (s.z > STARS.despawnZ) {
          const fresh = spawnStar(s.sparkle, aspect, true);
          Object.assign(s, fresh);
        }
        const far = Math.abs(s.z) / STARS.spawnFarMax >= STARS.cursorFarMinRatio;
        if (!far && (s.offX !== 0 || s.offY !== 0)) {
          s.x = s.originX + s.offX;
          s.y = s.originY + s.offY;
          s.offX = 0;
          s.offY = 0;
        }
        if (engage > 0.01) {
          const depthRatio = Math.abs(s.z) / STARS.cursorDepthRef;
          const radius = STARS.cursorRadius * depthRatio;
          const { halfW, halfH } = frustumHalfExtents(s.z, aspect);
          const px = (pointer.uvSmooth.x - 0.5) * 2 * halfW;
          const py = (pointer.uvSmooth.y - 0.5) * 2 * halfH;
          const cx = far ? s.originX + s.offX : s.x;
          const cy = far ? s.originY + s.offY : s.y;
          const dx = px - cx;
          const dy = py - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 < radius * radius) {
            const falloff = 1 - Math.sqrt(d2) / radius;
            const force = falloff * falloff * STARS.bulgeStrength * engage * depthRatio * dt * 4;
            if (far) {
              const d = Math.sqrt(d2);
              if (d >= 1e-4) {
                s.offX -= (dx / d) * force;
                s.offY -= (dy / d) * force;
                s.x = s.originX + s.offX;
                s.y = s.originY + s.offY;
              }
            } else {
              const d = Math.sqrt(d2);
              if (d >= 1e-4) {
                s.x -= (dx / d) * force;
                s.y -= (dy / d) * force;
              }
            }
          } else if (far) {
            returnToOrigin(s, dt);
          }
        } else if (far && (s.offX !== 0 || s.offY !== 0)) {
          returnToOrigin(s, dt);
        }
        positions[i * 3] = s.x;
        positions[i * 3 + 1] = s.y;
        positions[i * 3 + 2] = s.z;
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function useRenderTarget(width: number, height: number, options?: THREE.RenderTargetOptions) {
  const target = useMemo(
    () => new THREE.WebGLRenderTarget(width, height, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height],
  );
  useEffect(() => () => target.dispose(), [target]);
  return target;
}

function updatePointerFromClient(
  p: PointerState,
  clientX: number,
  clientY: number,
  container: HTMLElement,
  ww: number,
  wh: number,
) {
  const rect = container.getBoundingClientRect();
  const u = (clientX - rect.left) / rect.width;
  const v = (clientY - rect.top) / rect.height;
  p.uvPrev.x = p.uv.x;
  p.uvPrev.y = p.uv.y;
  p.uv.x = u;
  p.uv.y = 1 - v;
  p.x = u * ww - ww / 2;
  p.y = wh / 2 - v * wh;
  const dx = p.uv.x - p.uvPrev.x;
  const dy = p.uv.y - p.uvPrev.y;
  p.uvVel.x += (dx - p.uvVel.x) * 0.4;
  p.uvVel.y += (dy - p.uvVel.y) * 0.4;
}

const RELEASE_RATE = 10 / 7;

function approachBoost(current: number, target: number, slowTarget: number, dt: number) {
  const rate = target === slowTarget ? 10 : (target === 1 && current < 1) || target < current ? RELEASE_RATE : 10;
  const k = 1 - Math.exp(-rate * dt);
  let next = current + (target - current) * k;
  if (Math.abs(next - target) < 0.001) next = target;
  return next;
}

function updateScrollBoost(
  p: PointerState,
  direction: number,
  velocity: number,
  dt: number,
  gradientDown: number,
  gradientUp: number,
) {
  p.scrollDirection = direction;
  p.scrollSpeed = velocity;
  const speed = Math.abs(velocity);
  const down = direction === 1 && speed > 0.5;
  const up = direction === -1 && speed > 0.5;
  const particleTarget = down ? 8 : up ? 0.2 : 1;
  p.scrollBoost = approachBoost(p.scrollBoost, particleTarget, 0.2, dt);
  const gradientTarget = down ? gradientDown : up ? gradientUp : 1;
  p.scrollGradientBoost = approachBoost(p.scrollGradientBoost, gradientTarget, gradientUp, dt);
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

interface BackgroundSceneProps {
  containerRef: RefObject<HTMLDivElement | null>;
  fboScale: number;
  starCount: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
}

/**
 * Blob gradient + flying starfield rendered to an FBO, warped by a pointer
 * trail, composited to screen and bloomed. Mirrors the reference site's
 * merged background pipeline.
 */
export default function BackgroundScene({
  containerRef,
  fboScale,
  starCount,
  bloomIntensity,
  bloomThreshold,
  bloomSmoothing,
}: BackgroundSceneProps) {
  const { gl, size } = useThree();
  const width = size.width;
  const height = size.height;
  const fboW = Math.max(1, Math.round(width * fboScale));
  const fboH = Math.max(1, Math.round(height * fboScale));

  const gradientScene = useMemo(() => new THREE.Scene(), []);
  const starScene = useMemo(() => new THREE.Scene(), []);
  const trailScene = useMemo(() => new THREE.Scene(), []);
  const trailCamera = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  const pixelCamera = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100));
  const starCamera = useRef(new THREE.PerspectiveCamera(STARS.fov, 1, 1, 4000));

  const pointer = useMemo<PointerState>(
    () => ({
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      uv: { x: 0.5, y: 0.5 },
      uvPrev: { x: 0.5, y: 0.5 },
      uvSmooth: { x: 0.5, y: 0.5 },
      uvSmoothPrev: { x: 0.5, y: 0.5 },
      uvVel: { x: 0, y: 0 },
      speed: 0,
      engagement: 0,
      vfxEngage: 0,
      disengageProgress: 0,
      scrollDirection: 0,
      scrollSpeed: 0,
      scrollBoost: 1,
      scrollGradientBoost: 1,
    }),
    [],
  );

  const starfield = useMemo(() => createStarfield(pointer, starCount), [pointer, starCount]);

  const sceneTarget = useRenderTarget(fboW, fboH);
  const trailA = useRenderTarget(fboW, fboH, { type: THREE.HalfFloatType });
  const trailB = useRenderTarget(fboW, fboH, { type: THREE.HalfFloatType });
  const trailRead = useRef(trailA);
  const trailWrite = useRef(trailB);

  const gradientMaterial = useRef<THREE.ShaderMaterial>(null);
  const trailUniforms = useRef<Record<string, THREE.IUniform> | null>(null);
  const compositeUniforms = useRef<Record<string, THREE.IUniform> | null>(null);
  const colorTween = useRef<gsap.core.Timeline | null>(null);
  const dims = useRef({ ww: width, wh: height });

  const gradientGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    return g;
  }, []);

  const gradientUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_color1: { value: new THREE.Color(BACKGROUND.color1) },
      u_color2: { value: new THREE.Color(BACKGROUND.color2) },
      u_weight1: { value: BACKGROUND.colorWeights[0] },
      u_weight2: { value: BACKGROUND.colorWeights[1] },
      u_blobRandomness: { value: BACKGROUND.blobRandomness },
      u_blobDisplacement: { value: BACKGROUND.blobDisplacement },
      u_blobMorphSpeed: { value: BACKGROUND.blobMorphSpeed },
      u_colorBlend: { value: BACKGROUND.colorBlend },
    }),
    [],
  );

  const pointerRadius = 90 / Math.min(width, height);
  const trailUniformsInit = useMemo(
    () => ({
      u_trailPrev: { value: trailA.texture },
      u_time: { value: 0 },
      u_pointer: { value: new THREE.Vector2(0.5, 0.5) },
      u_pointerPrev: { value: new THREE.Vector2(0.5, 0.5) },
      u_pointerEngage: { value: 0 },
      u_pointerRadius: { value: pointerRadius },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_fade: { value: 0.968 },
      u_disengage: { value: 0 },
      u_ageRate: { value: 0.018 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trailA.texture],
  );
  const compositeUniformsInit = useMemo(
    () => ({
      u_scene: { value: sceneTarget.texture },
      u_trail: { value: trailB.texture },
      u_time: { value: 0 },
      u_pointerEngage: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sceneTarget.texture, trailB.texture],
  );

  useLayoutEffect(() => {
    trailRead.current = trailA;
    trailWrite.current = trailB;
  }, [trailA, trailB]);

  useLayoutEffect(() => {
    starScene.add(starfield.points);
    starfield.resize(width, height);
    return () => {
      starScene.remove(starfield.points);
    };
  }, [starScene, starfield, width, height]);

  useEffect(() => () => starfield.dispose(), [starfield]);

  useLayoutEffect(() => {
    dims.current = { ww: width, wh: height };
    const cam = pixelCamera.current;
    cam.left = -width / 2;
    cam.right = width / 2;
    cam.top = height / 2;
    cam.bottom = -height / 2;
    cam.position.z = 1;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    const pcam = starCamera.current;
    pcam.aspect = width / Math.max(height, 1);
    pcam.position.set(0, 0, 0);
    pcam.lookAt(0, 0, -1);
    pcam.updateProjectionMatrix();
    trailUniforms.current?.u_resolution.value.set(width, height);
    if (trailUniforms.current) trailUniforms.current.u_pointerRadius.value = 90 / Math.min(width, height);
    compositeUniforms.current?.u_resolution.value.set(width, height);
  }, [width, height]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      updatePointerFromClient(pointer, e.clientX, e.clientY, el, dims.current.ww, dims.current.wh);
    };
    const onTouch = (e: TouchEvent) => {
      const el = containerRef.current;
      if (!el || !e.touches.length) return;
      const t = e.touches[0];
      updatePointerFromClient(pointer, t.clientX, t.clientY, el, dims.current.ww, dims.current.wh);
    };
    const unregister = registerTickerCallback(() => {
      const dx = pointer.prevX - pointer.x;
      const dy = pointer.prevY - pointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pointer.speed += (dist - pointer.speed) * 0.5;
      if (pointer.speed < 0.001) pointer.speed = 0;
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      const target = Math.min(pointer.speed / 5, 1);
      pointer.engagement += (target - pointer.engagement) * 0.06;
      if (pointer.engagement < 0.001) pointer.engagement = 0;
    });
    const onColors = (e: Event) => {
      const { colors, duration } = (e as CustomEvent<{ colors?: string[]; duration?: number }>).detail ?? {};
      const u = gradientMaterial.current?.uniforms;
      if (!u || !colors || colors.length < 2) return;
      colorTween.current?.kill();
      const c1 = new THREE.Color(colors[0]);
      const c2 = new THREE.Color(colors[1]);
      colorTween.current = gsap
        .timeline({ defaults: { duration: duration ?? 3, ease: "power2" } })
        .to(u.u_color1.value, { r: c1.r, g: c1.g, b: c1.b }, 0)
        .to(u.u_color2.value, { r: c2.r, g: c2.g, b: c2.b }, 0);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("updateGlBackground", onColors);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("updateGlBackground", onColors);
      unregister();
      colorTween.current?.kill();
    };
  }, [containerRef, pointer]);

  useFrame((_, dt) => {
    // Smooth pointer + engagement bookkeeping.
    pointer.uvSmoothPrev.x = pointer.uvSmooth.x;
    pointer.uvSmoothPrev.y = pointer.uvSmooth.y;
    const k = 1 - Math.exp(-9 * dt);
    pointer.uvSmooth.x += (pointer.uv.x - pointer.uvSmooth.x) * k;
    pointer.uvSmooth.y += (pointer.uv.y - pointer.uvSmooth.y) * k;
    const lagX = pointer.uv.x - pointer.uvSmooth.x;
    const lagY = pointer.uv.y - pointer.uvSmooth.y;
    const lag = Math.sqrt(lagX * lagX + lagY * lagY);
    let engageTarget = pointer.engagement;
    if (lag > 0.0025) engageTarget = Math.max(engageTarget, Math.min(0.35 + 28 * lag, 1));
    const rate = 1 - Math.exp(-(lag <= 0.0025 && pointer.engagement < 0.03 ? 2.2 : 11) * dt);
    pointer.vfxEngage += (engageTarget - pointer.vfxEngage) * rate;
    if (pointer.vfxEngage < 0.008) pointer.vfxEngage = 0;
    pointer.disengageProgress =
      pointer.vfxEngage > 0.008 ? 0 : Math.min(pointer.disengageProgress + 1.35 * dt, 1.5);

    const lenis = useScrollStore.getState().lenis;
    updateScrollBoost(
      pointer,
      lenis?.direction ?? 0,
      lenis?.velocity ?? 0,
      dt,
      BACKGROUND.scrollGradientDownSpeed,
      BACKGROUND.scrollGradientUpSpeed,
    );

    const gradU = gradientMaterial.current?.uniforms;
    const trailU = trailUniforms.current;
    const compU = compositeUniforms.current;
    if (!gradU || !trailU || !compU) return;

    const trailActive = pointer.vfxEngage > 0.02 || pointer.disengageProgress > 0.02 || pointer.engagement > 0.02;
    gradU.u_time.value += dt * pointer.scrollGradientBoost;
    trailU.u_time.value += dt;
    compU.u_time.value += dt;

    const read = trailRead.current;
    const write = trailWrite.current;
    if (trailActive) {
      trailU.u_trailPrev.value = read.texture;
      trailU.u_pointer.value.set(pointer.uvSmooth.x, pointer.uvSmooth.y);
      trailU.u_pointerPrev.value.set(pointer.uvSmoothPrev.x, pointer.uvSmoothPrev.y);
      trailU.u_pointerEngage.value = pointer.vfxEngage;
      trailU.u_fade.value = Math.pow(0.968, 60 * dt);
      trailU.u_disengage.value = pointer.disengageProgress;
      trailU.u_ageRate.value = 0.018 * dt * 60;
      gl.setRenderTarget(write);
      gl.setClearColor(0, 0);
      gl.clear();
      gl.render(trailScene, trailCamera.current);
      trailRead.current = write;
      trailWrite.current = read;
    }

    starfield.tick(dt);
    gl.setRenderTarget(sceneTarget);
    gl.setClearColor(0, 0);
    gl.clear();
    gl.render(gradientScene, pixelCamera.current);
    gl.clearDepth();
    const pcam = starCamera.current;
    pcam.aspect = width / Math.max(height, 1);
    pcam.updateProjectionMatrix();
    gl.render(starScene, pcam);

    compU.u_scene.value = sceneTarget.texture;
    compU.u_trail.value = trailRead.current.texture;
    compU.u_pointerEngage.value = pointer.vfxEngage;
    gl.setRenderTarget(null);
    gl.setClearColor(0, 0);
  }, -100);

  return (
    <>
      {createPortal(
        <mesh geometry={gradientGeometry} scale={[width / 2, height / 2, 1]} frustumCulled={false}>
          <shaderMaterial
            ref={gradientMaterial}
            vertexShader={gradientVertex}
            fragmentShader={gradientFragment}
            uniforms={gradientUniforms}
          />
        </mesh>,
        gradientScene,
      )}
      {createPortal(
        <mesh frustumCulled={false}>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            ref={(m) => {
              trailUniforms.current = m?.uniforms ?? null;
            }}
            vertexShader={screenVertex}
            fragmentShader={trailFragment}
            uniforms={trailUniformsInit}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>,
        trailScene,
      )}
      <mesh frustumCulled={false} renderOrder={0}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={(m) => {
            compositeUniforms.current = m?.uniforms ?? null;
          }}
          vertexShader={screenVertex}
          fragmentShader={compositeFragment}
          uniforms={compositeUniformsInit}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <EffectComposer multisampling={0} renderPriority={1}>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={bloomSmoothing}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
