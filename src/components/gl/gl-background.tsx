"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, createPortal, type RootState } from "@react-three/fiber";
import { getGraphicsProfile } from "@/lib/graphics-profile";
import { BACKGROUND, PARTICLE } from "@/components/gl/particle-config";
import BackgroundScene from "@/components/gl/background-scene";
import { GeometryParticles, OverlayRenderer } from "@/components/gl/geometry-particles";
import ParticleScrollController from "@/components/gl/particle-scroll-controller";

/**
 * Fixed full-screen WebGL layer behind the page: gradient + stars + logo
 * particles. Falls back to a CSS gradient when WebGL is unavailable.
 */
export default function GlBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const profile = getGraphicsProfile();
  const overlayScene = useMemo(() => new THREE.Scene(), []);
  const overlayCamera = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2 * PARTICLE.CAMERA_Z));

  const onCreated = useCallback(({ gl }: RootState) => {
    if (gl.capabilities.maxTextureSize < 2048) {
      setFallback(true);
      return;
    }
    gl.setClearColor(0, 0);
    gl.domElement.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        setFallback(true);
      },
      { once: true },
    );
  }, []);

  if (fallback) {
    return (
      <>
        <div
          data-site-entrance-canvas
          aria-hidden
          className="gl-gradient pointer-events-none fixed inset-0 z-0 overflow-hidden"
          style={{ background: BACKGROUND.cssFallbackGradient }}
        />
        <ParticleScrollController />
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        data-site-entrance-canvas
        aria-hidden
        className="gl-gradient pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60"
      >
        <Canvas
          orthographic
          camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1, position: [0, 0, 0] }}
          gl={{ alpha: true, antialias: profile.antialias, powerPreference: "high-performance" }}
          dpr={Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, profile.dpr)}
          frameloop="always"
          style={{ width: "100%", height: "100%" }}
          onCreated={onCreated}
        >
          <Suspense fallback={null}>
            <BackgroundScene
              containerRef={containerRef}
              fboScale={profile.fboScale}
              starCount={profile.shaderParticleCount}
              bloomIntensity={profile.enableBloom ? BACKGROUND.bloomIntensity : 0}
              bloomThreshold={BACKGROUND.bloomThreshold}
              bloomSmoothing={BACKGROUND.bloomSmoothing}
            />
            {createPortal(
              <GeometryParticles containerRef={containerRef} overlayCameraRef={overlayCamera} />,
              overlayScene,
            )}
            <OverlayRenderer scene={overlayScene} cameraRef={overlayCamera} />
          </Suspense>
        </Canvas>
      </div>
      <ParticleScrollController />
    </>
  );
}
