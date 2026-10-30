"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ScrollTrigger } from "@/lib/gsap";
import { getGraphicsProfile } from "@/lib/graphics-profile";
import { PARTICLE } from "@/components/gl/particle-config";
import { createParticleField, type ParticleField, type PointerInfo } from "@/components/gl/particle-field";
import { particleScrollState, registerParticleField, unregisterParticleField } from "@/components/gl/particle-state";

const DEG = Math.PI / 180;
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const tmpWorld = new THREE.Vector3();
const tmpLocal = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const identityQuat = new THREE.Quaternion();

interface LocalPointer extends PointerInfo {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
  prevSmoothX: number;
  prevSmoothY: number;
}

function updatePointer(
  p: LocalPointer,
  clientX: number,
  clientY: number,
  container: HTMLElement | null,
  width: number,
  height: number,
) {
  if (!container) {
    p.active = false;
    return;
  }
  const rect = container.getBoundingClientRect();
  const lx = clientX - rect.left;
  const ly = clientY - rect.top;
  const inside = lx >= 0 && lx <= rect.width && ly >= 0 && ly <= rect.height;
  p.active = inside;
  if (inside) {
    p.x = lx - width / 2;
    p.y = -(ly - height / 2);
  }
}

interface GeometryParticlesProps {
  containerRef: RefObject<HTMLDivElement | null>;
  overlayCameraRef: RefObject<THREE.OrthographicCamera>;
}

/**
 * The logo particle cloud: tilts toward the pointer, spins with scroll,
 * repels particles near the cursor and follows the shared scroll state
 * (morph / dissolve / footer formation).
 */
export function GeometryParticles({ containerRef, overlayCameraRef }: GeometryParticlesProps) {
  const tiltGroup = useRef<THREE.Group>(null);
  const spinGroup = useRef<THREE.Group>(null);
  const placementGroup = useRef<THREE.Group>(null);
  const field = useRef<ParticleField | null>(null);
  const pointer = useMemo<LocalPointer>(
    () => ({
      x: 0,
      y: 0,
      smoothX: 0,
      smoothY: 0,
      localSmoothX: 0,
      localSmoothY: 0,
      prevSmoothX: 0,
      prevSmoothY: 0,
      speed: 0,
      active: false,
      engagement: 0,
    }),
    [],
  );
  const dims = useRef({ width: 0, height: 0 });
  const { size, camera } = useThree();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const profile = getGraphicsProfile();
    createParticleField(profile.particleCount, {
      twinklePercent: profile.particleTwinklePercent,
      twinkleIntensity: profile.particleTwinkleIntensity,
    })
      .then((created) => {
        if (cancelled) {
          created.dispose();
          return;
        }
        field.current = created;
        registerParticleField(created);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
      if (field.current) {
        unregisterParticleField(field.current);
        field.current.dispose();
        field.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !field.current || !placementGroup.current) return;
    const group = placementGroup.current;
    const points = field.current.points;
    group.add(points);
    ScrollTrigger.refresh();
    return () => {
      group.remove(points);
    };
  }, [ready]);

  useLayoutEffect(() => {
    dims.current = { width: size.width, height: size.height };
  }, [size.width, size.height]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { width, height } = dims.current;
      updatePointer(pointer, e.clientX, e.clientY, containerRef.current, width, height);
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const { width, height } = dims.current;
      updatePointer(pointer, t.clientX, t.clientY, containerRef.current, width, height);
    };
    const onLeave = () => {
      pointer.active = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef, pointer]);

  useLayoutEffect(() => {
    const cam = overlayCameraRef.current ?? camera;
    if (!(cam instanceof THREE.OrthographicCamera)) return;
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.near = 0.1;
    cam.far = 2 * PARTICLE.CAMERA_Z;
    cam.position.set(0, 0, PARTICLE.CAMERA_Z);
    cam.updateProjectionMatrix();
  }, [camera, overlayCameraRef, size]);

  useLayoutEffect(() => {
    if (!ready || !field.current) return;
    const scale = Math.min(size.width, size.height) * PARTICLE.SIZE_FILL;
    field.current.setScale(scale, size.width, size.height);
  }, [ready, size.width, size.height]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(Math.max(dtRaw, 0.001), 0.05);
    const follow = 1 - Math.exp(-16 * dt);
    if (pointer.active) {
      pointer.smoothX += (pointer.x - pointer.smoothX) * follow;
      pointer.smoothY += (pointer.y - pointer.smoothY) * follow;
    }
    const travel = Math.hypot(pointer.smoothX - pointer.prevSmoothX, pointer.smoothY - pointer.prevSmoothY) / dt;
    pointer.speed += (travel - pointer.speed) * (1 - Math.exp(-14 * dt));
    pointer.prevSmoothX = pointer.smoothX;
    pointer.prevSmoothY = pointer.smoothY;
    pointer.engagement += ((pointer.active ? 1 : 0) - pointer.engagement) * (1 - Math.exp(-10 * dt));

    const { width, height } = dims.current;

    // Tilt toward the pointer.
    const tilt = tiltGroup.current;
    if (tilt) {
      const rate = 1 - Math.exp(-PARTICLE.GROUP_ROTATION_SPEED * dt);
      const halfW = Math.max(0.5 * width, 1);
      const halfH = Math.max(0.5 * height, 1);
      if (pointer.engagement > 0.001) {
        const nx = (pointer.smoothX / halfW) * pointer.engagement;
        const ny = (pointer.smoothY / halfH) * pointer.engagement;
        tmpDir.set(-nx * PARTICLE.GROUP_LOOK_TILT, -ny * PARTICLE.GROUP_LOOK_TILT, 1).normalize();
        tmpQuat.setFromUnitVectors(Z_AXIS, tmpDir);
      } else {
        tmpQuat.copy(identityQuat);
      }
      tilt.quaternion.slerp(tmpQuat, rate);
      tilt.updateMatrixWorld();
    }

    const forming = (particleScrollState.rFormation ?? 0) > 0.001;
    const spin = spinGroup.current;
    if (spin) {
      spin.position.set(0, 0, 0);
      spin.scale.set(1, 1, 1);
      spin.rotation.x = 0;
      spin.rotation.z = 0;
      spin.rotation.y = forming ? 0 : (particleScrollState.geometryScrollRotationY ?? 0);
      spin.updateMatrixWorld();
    }

    const fill = Math.min(width, height) * PARTICLE.SIZE_FILL;
    const placement = placementGroup.current;
    if (placement) {
      if (forming) {
        placement.position.set(0, 0, 0);
        placement.rotation.set(0, 0, 0);
        placement.scale.set(1, 1, 1);
      } else {
        const p = particleScrollState.geometryPosition;
        const r = particleScrollState.geometryRotation;
        const s = particleScrollState.geometryScale;
        placement.position.set(p.x * fill, p.y * fill, p.z * fill);
        placement.rotation.set(r.x * DEG, r.y * DEG, r.z * DEG);
        placement.scale.set(s.x ?? 1, s.y ?? 1, s.z ?? 1);
      }
      placement.updateMatrixWorld();
      tmpWorld.set(pointer.smoothX, pointer.smoothY, 0);
      tmpLocal.copy(tmpWorld);
      placement.worldToLocal(tmpLocal);
      pointer.localSmoothX = tmpLocal.x;
      pointer.localSmoothY = tmpLocal.y;
    }

    field.current?.tick(dt, pointer);
  });

  return (
    <group ref={tiltGroup}>
      <group ref={spinGroup}>
        <group ref={placementGroup} />
      </group>
    </group>
  );
}

interface OverlayRendererProps {
  scene: THREE.Scene;
  cameraRef: RefObject<THREE.OrthographicCamera>;
}

/** Renders the particle overlay scene on top of the composited background. */
export function OverlayRenderer({ scene, cameraRef }: OverlayRendererProps) {
  const { gl, size } = useThree();
  useLayoutEffect(() => {
    const cam = cameraRef.current;
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.near = 0.1;
    cam.far = 2 * PARTICLE.CAMERA_Z;
    cam.position.set(0, 0, PARTICLE.CAMERA_Z);
    cam.updateProjectionMatrix();
  }, [cameraRef, size.width, size.height]);
  useFrame(() => {
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(scene, cameraRef.current);
  }, 2);
  return null;
}
