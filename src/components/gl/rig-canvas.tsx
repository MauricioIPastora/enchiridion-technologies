"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { getGraphicsProfile } from "@/lib/graphics-profile";
import { bp, maxWidth } from "@/lib/breakpoints";
import { normalizeRoutePath, revealRigCanvas, setRigCanvasHidden } from "@/lib/page-transitions";
import { useCursorStore } from "@/stores/cursor-store";
import { imagePlaneFragment, imagePlaneVertex } from "@/components/gl/shaders";
import { CAROUSEL_CONFIG, stepCarouselBarrel } from "@/components/gl/carousel-config";
import { createGridDataTexture, stepGridDistortion, type GridMouseState } from "@/components/gl/grid-distortion";

const CONFIG = {
  ...CAROUSEL_CONFIG,
  SCROLL_VELOCITY_SCALE: 8e-4,
  SCROLL_IMPULSE_SCALE: 0.008,
  PARALLAX_FACTOR: 1.2,
};

type GridMouse = GridMouseState;
const stepBarrel = stepCarouselBarrel;

/* ------------------------------------------------------------------ */
/* Planes                                                              */
/* ------------------------------------------------------------------ */

interface PlaneEntry {
  element: HTMLElement;
  dataTexture: THREE.DataTexture;
  mouse: GridMouse;
}

function ImagePlanes({ elements }: { elements: HTMLElement[] }) {
  const { size } = useThree();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const materials = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const entries = useRef<PlaneEntry[]>([]);
  const rects = useRef<{ left: number; top: number; width: number; height: number }[]>([]);
  const dirty = useRef(true);
  const lastScroll = useRef(0);
  const barrel = useRef(0);
  const direction = useRef(1);

  const urls = useMemo(() => elements.map((el) => el.getAttribute("data-src") ?? ""), [elements]);
  const textures = useLoader(THREE.TextureLoader, urls);

  useEffect(() => {
    const dataTextures = elements.map(() => createGridDataTexture());
    entries.current = elements.map((element, i) => ({
      element,
      dataTexture: dataTextures[i],
      mouse: { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 },
    }));
    return () => dataTextures.forEach((t) => t.dispose());
  }, [elements]);

  useEffect(() => {
    textures.forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [textures]);

  useEffect(() => {
    const markDirty = () => {
      dirty.current = true;
    };
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty, { passive: true });
    return () => {
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      let over = false;
      entries.current.forEach((entry) => {
        entry.mouse.vX = 0;
        entry.mouse.vY = 0;
        const r = entry.element.getBoundingClientRect();
        const u = (e.clientX - r.left) / r.width;
        const v = 1 - (e.clientY - r.top) / r.height;
        if (u < 0 || u > 1 || v < 0 || v > 1) return;
        over = true;
        entry.mouse.vX = u - entry.mouse.prevX;
        entry.mouse.vY = v - entry.mouse.prevY;
        entry.mouse.x = u;
        entry.mouse.y = v;
        entry.mouse.prevX = u;
        entry.mouse.prevY = v;
      });
      const setType = useCursorStore.getState().setType;
      if (over) {
        setType("hover");
        return;
      }
      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (!under?.closest("[data-event]")) setType("default");
    };
    const onLeave = () => useCursorStore.getState().setType("default");
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useFrame((_, dtRaw) => {
    const list = entries.current;
    if (!list.length) return;
    const dt = Math.min(dtRaw, 1 / 30);
    if (dirty.current) {
      rects.current = list.map((entry) => {
        const r = entry.element.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      });
      dirty.current = false;
    }
    const scrollY = window.scrollY;
    const delta = scrollY - lastScroll.current;
    lastScroll.current = scrollY;
    const moved = Math.abs(delta) > 0.5;
    barrel.current = stepBarrel(
      barrel.current,
      delta * CONFIG.SCROLL_VELOCITY_SCALE,
      delta * CONFIG.SCROLL_IMPULSE_SCALE,
      moved,
      dt,
    );
    if (moved) {
      const dir = delta > 0 ? 1 : -1;
      direction.current += (dir - direction.current) * 0.12;
    }
    list.forEach((entry) => stepGridDistortion(entry.dataTexture, entry.mouse));
    list.forEach((entry, i) => {
      const mesh = meshes.current[i];
      const mat = materials.current[i];
      const tex = textures[i];
      const r = rects.current[i];
      if (!mesh || !mat || !tex || !r || r.width <= 0 || r.height <= 0) return;
      const x = r.left - size.width / 2 + r.width / 2;
      const y = -r.top + size.height / 2 - r.height / 2;
      mesh.position.set(x, y, 0);
      mesh.scale.set(r.width, r.height, 1);
      const planeAspect = r.width / r.height;
      const img = tex.image as { width?: number; height?: number } | undefined;
      const imgAspect = img?.width && img?.height ? img.width / img.height : 1;
      let coverX = 1;
      let coverY = 1;
      if (planeAspect > imgAspect) coverY = imgAspect / planeAspect;
      else coverX = planeAspect / imgAspect;
      const repeatX = coverX / CONFIG.PARALLAX_FACTOR;
      const repeatY = coverY / CONFIG.PARALLAX_FACTOR;
      const maxShift = (coverY - repeatY) / 2;
      const safeCenter = (1 - repeatY) / 2;
      const centerRatio = (r.top + r.height / 2) / size.height - 0.5;
      const offsetY = Math.max(0, Math.min(1 - repeatY, safeCenter + centerRatio * 2 * maxShift));
      mat.uniforms.uTextureRepeat.value.set(repeatX, repeatY);
      mat.uniforms.uTextureOffset.value.set((1 - repeatX) / 2, offsetY);
      mat.uniforms.uMeshY.value = -(r.top + r.height / 2 - size.height / 2);
      mat.uniforms.uMeshHeight.value = r.height;
      mat.uniforms.uViewportHeight.value = size.height;
      mat.uniforms.uBarrelStrength.value = barrel.current;
      mat.uniforms.uScrollDirection.value = direction.current;
      mat.uniforms.uDataTexture.value = entry.dataTexture;
    });
  });

  if (!elements.length) return null;

  return (
    <>
      {elements.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
        >
          <planeGeometry args={[1, 1, CONFIG.PLANE_SEGMENTS_X, CONFIG.PLANE_SEGMENTS_Y]} />
          <shaderMaterial
            ref={(m) => {
              if (m) materials.current[i] = m;
            }}
            vertexShader={imagePlaneVertex}
            fragmentShader={imagePlaneFragment}
            uniforms={{
              uTexture: { value: textures[i] },
              uDataTexture: { value: null },
              uAlpha: { value: 1 },
              uMeshY: { value: 0 },
              uMeshHeight: { value: 1 },
              uViewportHeight: { value: 1 },
              uBarrelStrength: { value: 0 },
              uBarrelScale: { value: CONFIG.BARREL_SCALE },
              uBarrelEdgeLift: { value: CONFIG.BARREL_EDGE_LIFT },
              uScrollDirection: { value: 1 },
              uTextureRepeat: { value: new THREE.Vector2(1, 1) },
              uTextureOffset: { value: new THREE.Vector2(0, 0) },
              uGridUvDistort: { value: CONFIG.GRID_UV_DISTORT },
            }}
            transparent
          />
        </mesh>
      ))}
    </>
  );
}

/** Keeps the canvas hidden until two frames have rendered (avoids a flash). */
function RevealAfterFrames({ active }: { active: boolean }) {
  const pathname = usePathname();
  const frames = useRef(0);
  const revealed = useRef(false);
  useLayoutEffect(() => {
    revealed.current = false;
    frames.current = 0;
    setRigCanvasHidden();
  }, [pathname, active]);
  useFrame(() => {
    if (revealed.current || !active) return;
    frames.current += 1;
    if (frames.current >= 2) {
      revealed.current = true;
      revealRigCanvas();
    }
  });
  return null;
}

/**
 * Transparent canvas that renders the featured-work covers as WebGL planes
 * sitting exactly over their DOM placeholders, with scroll barrel distortion
 * and a pointer-driven ripple. Desktop only (DOM images are used below 1024px).
 */
export default function RigCanvas() {
  const pathname = usePathname();
  const route = normalizeRoutePath(pathname);
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(maxWidth(bp.tabletLandscape)).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(maxWidth(bp.tabletLandscape));
    const update = () => setNarrow(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (route !== "/" || narrow) {
      setElements([]);
      return;
    }
    // Wait a frame so the page markup is in the DOM.
    const raf = requestAnimationFrame(() => {
      setElements(Array.from(document.querySelectorAll<HTMLElement>('[data-type="image"]')));
    });
    return () => cancelAnimationFrame(raf);
  }, [route, narrow]);

  const active = elements.length > 0;
  if (!active) return null;
  const profile = getGraphicsProfile();

  return (
    <div data-rig-canvas className="pointer-events-none fixed top-0 left-0 z-2 h-screen w-screen">
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 100] }}
        frameloop="always"
        dpr={Math.min(window.devicePixelRatio, profile.dpr)}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <ImagePlanes elements={elements} />
        </Suspense>
        <RevealAfterFrames active={active} />
      </Canvas>
    </div>
  );
}
