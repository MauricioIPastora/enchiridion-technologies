"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "@/lib/gsap";
import { getGraphicsProfile } from "@/lib/graphics-profile";
import { bp, maxWidth, useMediaQuery } from "@/lib/breakpoints";
import { CAROUSEL_CONFIG as CFG, stepCarouselBarrel } from "@/components/gl/carousel-config";
import {
  clearGridMouseVelocity,
  createGridDataTexture,
  createGridMouseState,
  stepGridDistortion,
  updateGridMouseFromUv,
  type GridMouseState,
} from "@/components/gl/grid-distortion";
import { useCarouselStore } from "@/stores/carousel-store";
import { useCursorStore } from "@/stores/cursor-store";
import { works, type Work } from "@/content/site";

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
uniform float uBarrelStrength;
uniform float uBarrelScale;
uniform float uBarrelEdgeLift;
uniform float uMeshX;
uniform float uMeshWidth;
uniform float uViewportWidth;

varying vec2 vUv;

const float M_PI = 3.14159265;

// Global viewport pincushion on Y, continuous across all visible cards.
vec3 globalViewportBarrelY(vec3 pos) {
  float vertexWorldX = uMeshX + pos.x * uMeshWidth;
  float normalizedX = clamp(vertexWorldX / (uViewportWidth * 0.5), -1.0, 1.0);
  float distFromCenter = abs(normalizedX);

  float pinchAtX = cos(distFromCenter * M_PI * 0.5);
  float edgeAtX = 1.0 - pinchAtX;
  float s = uBarrelStrength * uBarrelScale;

  pos.y *= 1.0 - pinchAtX * s;
  pos.y *= 1.0 + edgeAtX * s * uBarrelEdgeLift;

  return pos;
}

void main() {
  vUv = uv;
  vec3 pos = globalViewportBarrelY(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uImageTexture;
uniform sampler2D uVideoTexture;
uniform sampler2D uDispTexture;
uniform sampler2D uDataTexture;
uniform vec4 uImageCover;
uniform vec4 uVideoCover;
uniform float uProgress;
uniform float uDispEffectFactor;
uniform float uGridUvDistort;
uniform float uReveal;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec4 cover) {
  return uv * cover.xy + cover.zw;
}

vec2 distortCoverUv(vec2 uv, vec4 cover) {
  vec2 baseUv = coverUv(uv, cover);
  vec4 gridOffset = texture2D(uDataTexture, uv);
  return baseUv - uGridUvDistort * gridOffset.rg;
}

void main() {
  // Entry reveal: cards appear with a displaced UV and alpha 0 -> 1.
  vec4 disp = texture2D(uDispTexture, vUv);
  float dispVal = disp.r * uDispEffectFactor;
  float revealDisp = (1.0 - uReveal) * dispVal;

  vec2 imgUv = distortCoverUv(vUv, uImageCover);
  vec2 videoUv = distortCoverUv(vUv, uVideoCover);
  imgUv.x += revealDisp;
  videoUv.x += revealDisp;

  vec4 color;
  if (uProgress >= 0.999) {
    color = texture2D(uVideoTexture, videoUv);
  } else if (uProgress <= 0.001) {
    color = texture2D(uImageTexture, imgUv);
  } else {
    vec2 distortedImg = vec2(imgUv.x + uProgress * dispVal, imgUv.y);
    vec2 distortedVideo = vec2(videoUv.x - (1.0 - uProgress) * dispVal, videoUv.y);
    vec4 imgColor = texture2D(uImageTexture, distortedImg);
    vec4 videoColor = texture2D(uVideoTexture, distortedVideo);
    color = mix(imgColor, videoColor, uProgress);
  }

  color.a *= uReveal;
  gl_FragColor = color;
}
`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SLIDES = works;

type SlideUniforms = {
  uImageTexture: { value: THREE.Texture };
  uVideoTexture: { value: THREE.Texture };
  uImageCover: { value: THREE.Vector4 };
  uVideoCover: { value: THREE.Vector4 };
  uProgress: { value: number };
  uBarrelStrength: { value: number };
  uBarrelScale: { value: number };
  uBarrelEdgeLift: { value: number };
  uMeshX: { value: number };
  uMeshWidth: { value: number };
  uViewportWidth: { value: number };
  uDispTexture: { value: THREE.Texture };
  uDispEffectFactor: { value: number };
  uDataTexture: { value: THREE.DataTexture };
  uGridUvDistort: { value: number };
  uReveal: { value: number };
};

interface SlideEntry {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  uniforms: SlideUniforms;
  dataTexture: THREE.DataTexture;
  mouseState: GridMouseState;
  baseOffsetX: number;
  dataIndex: number;
  videoElement: HTMLVideoElement | null;
  videoTexture: THREE.Texture;
  hoverType: Work["hoverType"];
  unbindVideoCover?: () => void;
  isShowingHover: boolean;
}

function isIgnoredTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest("[data-carousel-ignore]") !== null;
}

/** object-fit: cover as a (scale, offset) pair for a media of w×h in a plane of `aspect`. */
function coverFit(w: number, h: number, aspect: number): [number, number, number, number] {
  if (w <= 0 || h <= 0) return [1, 1, 0, 0];
  const mediaAspect = w / h;
  if (mediaAspect > aspect) {
    const sx = aspect / mediaAspect;
    return [sx, 1, (1 - sx) * 0.5, 0];
  }
  const sy = mediaAspect / aspect;
  return [1, sy, 0, (1 - sy) * 0.5];
}

function createVideoElement(src: string) {
  const v = document.createElement("video");
  v.src = src;
  v.loop = true;
  v.muted = true;
  v.playsInline = true;
  v.preload = "metadata";
  v.crossOrigin = "anonymous";
  return v;
}

function textureSize(tex: THREE.Texture) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  return { w: img?.width ?? 0, h: img?.height ?? 0 };
}

function applyImageCover(entry: SlideEntry, tex: THREE.Texture) {
  const { w, h } = textureSize(tex);
  entry.uniforms.uImageCover.value.fromArray(coverFit(w, h, CFG.SLIDE_ASPECT_RATIO));
}

function applyHoverImageCover(target: { value: THREE.Vector4 }, tex: THREE.Texture) {
  const { w, h } = textureSize(tex);
  target.value.fromArray(coverFit(w, h, CFG.SLIDE_ASPECT_RATIO));
}

function bindVideoCover(entry: { videoElement: HTMLVideoElement | null; uniforms: { uVideoCover: { value: THREE.Vector4 } } }) {
  const video = entry.videoElement;
  if (!video) return undefined;
  const update = () => {
    entry.uniforms.uVideoCover.value.fromArray(coverFit(video.videoWidth, video.videoHeight, CFG.SLIDE_ASPECT_RATIO));
  };
  video.addEventListener("loadedmetadata", update);
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) update();
  return () => video.removeEventListener("loadedmetadata", update);
}

/** Points an entry's hover media at the given slide's media. */
function applyHoverMedia(entry: SlideEntry, slide: Work, hoverImages: Map<string, THREE.Texture>) {
  entry.unbindVideoCover?.();
  entry.hoverType = slide.hoverType;
  if (slide.hoverType === "video") {
    if (!entry.videoElement) {
      entry.videoElement = createVideoElement("");
      const vt = new THREE.VideoTexture(entry.videoElement);
      vt.minFilter = THREE.LinearFilter;
      vt.magFilter = THREE.LinearFilter;
      vt.format = THREE.RGBAFormat;
      entry.videoTexture = vt;
      entry.uniforms.uVideoTexture.value = vt;
    }
    entry.videoElement.src = slide.hoverTexture;
    entry.unbindVideoCover = bindVideoCover(entry);
    return;
  }
  if (entry.videoElement) {
    entry.videoElement.pause();
    entry.videoElement.src = "";
  }
  const tex = hoverImages.get(slide.id);
  if (tex) {
    entry.uniforms.uVideoTexture.value = tex;
    entry.videoTexture = tex;
    applyHoverImageCover(entry.uniforms.uVideoCover, tex);
  }
}

function resetHover(entry: SlideEntry) {
  gsap.killTweensOf(entry.uniforms.uProgress);
  entry.uniforms.uProgress.value = 0;
  entry.isShowingHover = false;
  entry.videoElement?.pause();
}

interface SlideLayout {
  width: number;
  height: number;
  gap: number;
  stride: number;
}

function slideLayout(camera: THREE.PerspectiveCamera, width: number, height: number): SlideLayout {
  const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
  const visibleWidth = (width / height) * visibleHeight;
  let w: number;
  let h: number;
  if (width < CFG.BREAKPOINT_MOBILE) {
    w = visibleWidth * CFG.SLIDE_MOBILE_VW;
    h = w / CFG.SLIDE_ASPECT_RATIO;
  } else if (width < CFG.BREAKPOINT_TABLET) {
    w = visibleWidth * CFG.SLIDE_TABLET_VW;
    h = w / CFG.SLIDE_ASPECT_RATIO;
  } else {
    const maxW = visibleWidth * CFG.SLIDE_MAX_VW;
    h = visibleHeight * CFG.SLIDE_MAX_VH;
    w = h * CFG.SLIDE_ASPECT_RATIO;
    if (w > maxW) {
      w = maxW;
      h = w / CFG.SLIDE_ASPECT_RATIO;
    }
  }
  const gap = w * CFG.SLIDE_GAP_RATIO;
  return { width: w, height: h, gap, stride: w + gap };
}

function closestToCenter(entries: SlideEntry[]) {
  return entries.reduce((best, e) => (Math.abs(e.mesh.position.x) < Math.abs(best.mesh.position.x) ? e : best));
}

/** Critically damped spring toward the snap target (SmoothDamp). */
function stepScroll(
  state: { globalOffset: number; scrollVelocity: number },
  { pendingVelocity, snapTarget, hadInput, dt }: { pendingVelocity: number; snapTarget: number; hadInput: boolean; dt: number },
) {
  let { globalOffset, scrollVelocity } = state;
  scrollVelocity += pendingVelocity;
  if (hadInput) {
    scrollVelocity *= Math.pow(CFG.SCROLL_DAMPING, 60 * dt);
    globalOffset += scrollVelocity * dt * 60;
  } else {
    const velocity = 60 * scrollVelocity;
    const omega = 2 / Math.max(1e-4, CFG.SNAP_SMOOTH_TIME);
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = globalOffset - snapTarget;
    const temp = (velocity + omega * change) * dt;
    globalOffset = snapTarget + (change + temp) * exp;
    scrollVelocity = ((velocity - omega * temp) * exp) / 60;
  }
  if (!hadInput && Math.abs(snapTarget - globalOffset) < CFG.SNAP_SETTLE_OFFSET && Math.abs(scrollVelocity) < CFG.SNAP_SETTLE_VELOCITY) {
    globalOffset = snapTarget;
    scrollVelocity = 0;
  }
  return { globalOffset, scrollVelocity };
}

function videoReady(video: HTMLVideoElement | null) {
  return !!video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

function setHoverVisible(entry: SlideEntry, visible: boolean) {
  if (visible && !entry.isShowingHover) {
    entry.isShowingHover = true;
    gsap.killTweensOf(entry.uniforms.uProgress);
    const startTransition = () => {
      if (!entry.isShowingHover) return;
      gsap.to(entry.uniforms.uProgress, {
        value: 1,
        duration: CFG.TRANSITION_DURATION,
        ease: CFG.TRANSITION_EASE,
        onComplete: () => {
          entry.uniforms.uProgress.value = 1;
        },
      });
    };
    if (entry.hoverType === "video" && entry.videoElement) {
      const video = entry.videoElement;
      video.play().catch(() => {});
      if (videoReady(video)) {
        startTransition();
      } else {
        // Keep the cover until the first frame has decoded so the plane never flashes blank.
        const onReady = () => {
          video.removeEventListener("loadeddata", onReady);
          startTransition();
        };
        video.addEventListener("loadeddata", onReady, { once: true });
      }
    } else {
      startTransition();
    }
    return;
  }
  if (!visible && entry.isShowingHover) {
    entry.isShowingHover = false;
    gsap.killTweensOf(entry.uniforms.uProgress);
    gsap.to(entry.uniforms.uProgress, {
      value: 0,
      duration: CFG.TRANSITION_DURATION,
      ease: CFG.TRANSITION_EASE,
      onComplete: () => {
        entry.uniforms.uProgress.value = 0;
        if (entry.hoverType === "video") entry.videoElement?.pause();
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

function useCarouselInput({
  onVelocity,
  onValidClick,
}: {
  onVelocity: (v: number) => void;
  onValidClick: (p: { clientX: number; clientY: number }) => void;
}) {
  useEffect(() => {
    if (navigator.maxTouchPoints > 0) {
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let startX = 0;
      let startY = 0;
      let dragged = false;
      const onStart = (e: TouchEvent) => {
        startX = lastX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        lastTime = performance.now();
        velocity = 0;
        dragged = false;
      };
      const onMove = (e: TouchEvent) => {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dt = Math.max(performance.now() - lastTime, 1);
        velocity = ((x - lastX) / dt) * CFG.TOUCH_DRAG_SPEED * 16 * CFG.TOUCH_DRAG_DIRECTION;
        lastX = x;
        lastTime = performance.now();
        if (Math.abs(x - startX) > CFG.CLICK_DRAG_THRESHOLD || Math.abs(y - startY) > CFG.CLICK_DRAG_THRESHOLD) dragged = true;
        onVelocity(velocity);
      };
      const onEnd = (e: TouchEvent) => {
        onVelocity(velocity * (CFG.TOUCH_MOMENTUM_SPEED / CFG.TOUCH_DRAG_SPEED));
        const t = e.changedTouches[0];
        if (!dragged && t && !isIgnoredTarget(e.target)) onValidClick({ clientX: t.clientX, clientY: t.clientY });
      };
      window.addEventListener("touchstart", onStart, { passive: true });
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onEnd);
      return () => {
        window.removeEventListener("touchstart", onStart);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
      };
    }
    let downX = 0;
    let downY = 0;
    let dragged = false;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      dragged = false;
    };
    const onMove = (e: PointerEvent) => {
      if (Math.abs(e.clientX - downX) > CFG.CLICK_DRAG_THRESHOLD || Math.abs(e.clientY - downY) > CFG.CLICK_DRAG_THRESHOLD) dragged = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragged && !isIgnoredTarget(e.target)) onValidClick({ clientX: e.clientX, clientY: e.clientY });
    };
    const onWheel = (e: WheelEvent) => {
      if (isIgnoredTarget(e.target)) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      onVelocity(-delta * CFG.SCROLL_SPEED);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, [onVelocity, onValidClick]);
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function CarouselScene({ isTablet }: { isTablet: boolean }) {
  const { camera, size, scene, gl } = useThree();
  const perspective = camera as THREE.PerspectiveCamera;
  const requestSlideSelection = useCarouselStore((s) => s.requestSlideSelection);
  const setCenteredSlideId = useCarouselStore((s) => s.setCenteredSlideId);
  const currentSlideId = useCarouselStore((s) => s.currentSlideId);
  const pendingSlideId = useCarouselStore((s) => s.pendingSlideId);

  const entries = useRef<SlideEntry[]>([]);
  const images = useRef(new Map<string, THREE.Texture>());
  const hoverImages = useRef(new Map<string, THREE.Texture>());
  const dispTexture = useRef<THREE.Texture | null>(null);
  const layout = useRef<SlideLayout>({ width: 1, height: 1, gap: 0.04, stride: 1.04 });
  const raycaster = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2());
  const globalOffset = useRef(0);
  const scrollVelocity = useRef(0);
  const barrel = useRef(0);
  const pendingVelocity = useRef(0);
  const snapEntry = useRef<SlideEntry | null>(null);
  const selectOnSnap = useRef(false);
  const selectCenteredOnSettle = useRef(false);
  const lastCenteredId = useRef<string | null>(null);
  const initialised = useRef(false);
  const revealed = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef(currentSlideId);
  const pendingRef = useRef(pendingSlideId);
  const tabletRef = useRef(isTablet);

  useEffect(() => {
    currentRef.current = currentSlideId;
  }, [currentSlideId]);
  useEffect(() => {
    pendingRef.current = pendingSlideId;
  }, [pendingSlideId]);
  useEffect(() => {
    tabletRef.current = isTablet;
  }, [isTablet]);

  const playReveal = useCallback(() => {
    if (revealed.current) return;
    const list = entries.current;
    if (!list.length) return;
    revealed.current = true;
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    const stride = layout.current.stride;
    list.forEach((entry) => {
      const ring = stride <= 0 ? 0 : Math.round(Math.abs(entry.mesh.position.x) / stride);
      gsap.killTweensOf(entry.uniforms.uReveal);
      entry.uniforms.uReveal.value = 0;
      gsap.to(entry.uniforms.uReveal, {
        value: 1,
        duration: CFG.ENTRY_REVEAL_DURATION,
        ease: CFG.ENTRY_REVEAL_EASE,
        delay: CFG.ENTRY_REVEAL_DELAY + ring * CFG.ENTRY_REVEAL_STAGGER,
      });
    });
  }, []);

  const maybeReveal = useCallback(() => {
    if (revealed.current) return;
    const list = entries.current;
    if (list.length && dispTexture.current && list.every((e) => images.current.has(SLIDES[e.dataIndex].id))) playReveal();
  }, [playReveal]);

  const playRevealRef = useRef(playReveal);
  const maybeRevealRef = useRef(maybeReveal);
  useEffect(() => {
    playRevealRef.current = playReveal;
    maybeRevealRef.current = maybeReveal;
  }, [playReveal, maybeReveal]);

  // Load covers, hover images and the displacement texture.
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    SLIDES.forEach((slide) => {
      loader.load(slide.image, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        images.current.set(slide.id, tex);
        entries.current.forEach((entry) => {
          if (SLIDES[entry.dataIndex].id === slide.id) {
            entry.uniforms.uImageTexture.value = tex;
            applyImageCover(entry, tex);
          }
        });
        maybeRevealRef.current();
      });
      if (slide.hoverType === "image") {
        loader.load(slide.hoverTexture, (tex) => {
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          hoverImages.current.set(slide.id, tex);
          entries.current.forEach((entry) => {
            if (SLIDES[entry.dataIndex].id === slide.id && entry.hoverType === "image") {
              entry.uniforms.uVideoTexture.value = tex;
              entry.videoTexture = tex;
              applyHoverImageCover(entry.uniforms.uVideoCover, tex);
            }
          });
        });
      }
    });
    loader.load(CFG.DISPLACEMENT_TEXTURE_URL, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      dispTexture.current = tex;
      entries.current.forEach((entry) => {
        entry.uniforms.uDispTexture.value = tex;
      });
      maybeRevealRef.current();
    });
  }, []);

  const relayout = useCallback(
    (width: number, height: number) => {
      const next = slideLayout(perspective, width, height);
      const list = entries.current;
      const prevStride = layout.current.stride;
      const ratio = list.length && prevStride > 0 ? next.stride / prevStride : 1;
      if (list.length && ratio !== 1) {
        globalOffset.current *= ratio;
        list.forEach((e) => {
          e.baseOffsetX *= ratio;
        });
      }
      list.forEach((e) => {
        e.mesh.scale.set(next.width, next.height, 1);
        e.uniforms.uMeshWidth.value = next.width;
      });
      layout.current = next;
    },
    [perspective],
  );

  function shiftEntryData(entry: SlideEntry, dir: number) {
    entry.dataIndex = (entry.dataIndex + dir + SLIDES.length) % SLIDES.length;
    const slide = SLIDES[entry.dataIndex];
    entry.mesh.userData.slideId = slide.id;
    const tex = images.current.get(slide.id);
    if (tex) {
      entry.uniforms.uImageTexture.value = tex;
      applyImageCover(entry, tex);
    }
    resetHover(entry);
    applyHoverMedia(entry, slide, hoverImages.current);
  }

  // Build the ring of planes.
  useEffect(() => {
    const initial = slideLayout(perspective, size.width, size.height);
    layout.current = initial;
    const { width, height, stride } = initial;
    const half = Math.floor(CFG.VISIBLE_SLIDES / 2);
    const geometry = new THREE.PlaneGeometry(1, 1, CFG.PLANE_SEGMENTS_X, CFG.PLANE_SEGMENTS_Y);
    const built: SlideEntry[] = [];

    for (let i = 0; i < CFG.VISIBLE_SLIDES; i++) {
      const dataIndex = (((i - half) % SLIDES.length) + SLIDES.length) % SLIDES.length;
      const slide = SLIDES[dataIndex];

      let videoElement: HTMLVideoElement | null = null;
      let videoTexture: THREE.Texture;
      const videoCover = new THREE.Vector4(1, 1, 0, 0);
      let unbindVideoCover: (() => void) | undefined;
      if (slide.hoverType === "video") {
        videoElement = createVideoElement(slide.hoverTexture);
        const vt = new THREE.VideoTexture(videoElement);
        vt.minFilter = THREE.LinearFilter;
        vt.magFilter = THREE.LinearFilter;
        vt.format = THREE.RGBAFormat;
        videoTexture = vt;
        unbindVideoCover = bindVideoCover({ videoElement, uniforms: { uVideoCover: { value: videoCover } } });
      } else {
        videoTexture = hoverImages.current.get(slide.id) ?? new THREE.Texture();
        if (hoverImages.current.has(slide.id)) applyHoverImageCover({ value: videoCover }, videoTexture);
      }

      const dataTexture = createGridDataTexture();
      const uniforms: SlideUniforms = {
        uImageTexture: { value: images.current.get(slide.id) ?? new THREE.Texture() },
        uVideoTexture: { value: videoTexture },
        uImageCover: { value: new THREE.Vector4(1, 1, 0, 0) },
        uVideoCover: { value: videoCover },
        uProgress: { value: 0 },
        uBarrelStrength: { value: 0 },
        uBarrelScale: { value: CFG.BARREL_SCALE },
        uBarrelEdgeLift: { value: CFG.BARREL_EDGE_LIFT },
        uMeshX: { value: 0 },
        uMeshWidth: { value: width },
        uViewportWidth: { value: 1 },
        uDispTexture: { value: dispTexture.current ?? new THREE.Texture() },
        uDispEffectFactor: { value: CFG.TRANSITION_DISPLACEMENT_EFFECT },
        uDataTexture: { value: dataTexture },
        uGridUvDistort: { value: CFG.GRID_UV_DISTORT },
        uReveal: { value: 0 },
      };
      const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.FrontSide, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.userData.slideId = slide.id;
      const baseOffsetX = (i - half) * stride;
      mesh.position.x = baseOffsetX;
      mesh.scale.set(width, height, 1);
      scene.add(mesh);

      const entry: SlideEntry = {
        mesh,
        material,
        uniforms,
        dataTexture,
        mouseState: createGridMouseState(),
        baseOffsetX,
        dataIndex,
        videoElement,
        videoTexture,
        hoverType: slide.hoverType,
        unbindVideoCover,
        isShowingHover: false,
      };
      built.push(entry);
      const cover = images.current.get(slide.id);
      if (cover) applyImageCover(entry, cover);
    }
    entries.current = built;

    // Arrive with a specific slide centred (e.g. clicked on the home page).
    const requested = useCarouselStore.getState().pendingSlideId;
    if (requested) {
      const targetIndex = SLIDES.findIndex((s) => s.id === requested);
      if (targetIndex >= 0) {
        built.forEach((entry, i) => {
          const di = (((targetIndex + (i - half)) % SLIDES.length) + SLIDES.length) % SLIDES.length;
          entry.dataIndex = di;
          const slide = SLIDES[di];
          entry.mesh.userData.slideId = slide.id;
          const tex = images.current.get(slide.id);
          if (tex) {
            entry.uniforms.uImageTexture.value = tex;
            applyImageCover(entry, tex);
          }
          resetHover(entry);
          applyHoverMedia(entry, slide, hoverImages.current);
        });
        globalOffset.current = 0;
        scrollVelocity.current = 0;
        snapEntry.current = built[half];
        lastCenteredId.current = requested;
        initialised.current = true;
        setCenteredSlideId(requested);
      }
    }

    built.forEach((e) => {
      gsap.killTweensOf(e.uniforms.uReveal);
      e.uniforms.uReveal.value = 0;
    });
    revealed.current = false;
    maybeRevealRef.current();
    revealTimer.current = setTimeout(() => playRevealRef.current(), CFG.ENTRY_REVEAL_MAX_WAIT_MS);

    const imagesMap = images.current;
    const hoverMap = hoverImages.current;
    return () => {
      if (revealTimer.current) {
        clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
      geometry.dispose();
      built.forEach((e) => {
        gsap.killTweensOf(e.uniforms.uReveal);
        gsap.killTweensOf(e.uniforms.uProgress);
        e.unbindVideoCover?.();
        e.dataTexture.dispose();
        scene.remove(e.mesh);
        e.material.dispose();
        if (e.hoverType === "video") {
          e.videoTexture.dispose();
          if (e.videoElement) {
            e.videoElement.pause();
            e.videoElement.src = "";
          }
        }
      });
      imagesMap.forEach((t) => t.dispose());
      imagesMap.clear();
      hoverMap.forEach((t) => t.dispose());
      hoverMap.clear();
      dispTexture.current?.dispose();
      dispTexture.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    relayout(size.width, size.height);
  }, [size.width, size.height, relayout]);

  useCarouselInput({
    onVelocity: useCallback((v: number) => {
      if (Math.abs(v) > 0) {
        snapEntry.current = null;
        selectOnSnap.current = false;
        selectCenteredOnSettle.current = true;
      }
      pendingVelocity.current += v;
    }, []),
    onValidClick: useCallback(
      (p: { clientX: number; clientY: number }) => {
        const list = entries.current;
        if (!list.length) return;
        const rect = gl.domElement.getBoundingClientRect();
        ndc.current.x = ((p.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.current.y = -(2 * ((p.clientY - rect.top) / rect.height)) + 1;
        raycaster.current.setFromCamera(ndc.current, camera);
        const hits = raycaster.current.intersectObjects(list.map((e) => e.mesh));
        if (!hits.length) return;
        const entry = list.find((e) => e.mesh === hits[0].object);
        if (!entry) return;
        const id = SLIDES[entry.dataIndex].id;
        snapEntry.current = entry;
        selectOnSnap.current = false;
        setCenteredSlideId(id);
        // Click the selected slide again to collapse it.
        requestSlideSelection(currentRef.current === id && pendingRef.current === undefined ? null : id);
      },
      [gl, camera, requestSlideSelection, setCenteredSlideId],
    ),
  });

  // Pointer ripple + cursor state.
  useEffect(() => {
    const rc = new THREE.Raycaster();
    const v = new THREE.Vector2();
    const onMove = (e: MouseEvent) => {
      const list = entries.current;
      if (!list.length) return;
      const rect = gl.domElement.getBoundingClientRect();
      v.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      v.y = -(2 * ((e.clientY - rect.top) / rect.height)) + 1;
      rc.setFromCamera(v, camera);
      const hits = rc.intersectObjects(list.map((en) => en.mesh));
      list.forEach((en) => clearGridMouseVelocity(en.mouseState));
      const setType = useCursorStore.getState().setType;
      if (hits.length > 0 && hits[0].uv) {
        const entry = list.find((en) => en.mesh === hits[0].object);
        if (entry) {
          setType("hover");
          updateGridMouseFromUv(entry.mouseState, hits[0].uv.x, hits[0].uv.y);
          return;
        }
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
  }, [gl, camera]);

  useFrame((_, dtRaw) => {
    const list = entries.current;
    if (!list.length) return;
    const dt = Math.min(dtRaw, 1 / 30);
    const { width, stride } = layout.current;
    const ringWidth = CFG.VISIBLE_SLIDES * stride;
    const halfRing = ringWidth / 2;
    const input = pendingVelocity.current;
    pendingVelocity.current = 0;
    const hadInput = Math.abs(input) > 0;
    const snapTarget = -(snapEntry.current ?? closestToCenter(list)).baseOffsetX;

    const next = stepScroll(
      { globalOffset: globalOffset.current, scrollVelocity: scrollVelocity.current },
      { pendingVelocity: input, snapTarget, hadInput, dt },
    );
    globalOffset.current = next.globalOffset;
    scrollVelocity.current = next.scrollVelocity;

    const settled =
      Math.abs(snapTarget - next.globalOffset) < CFG.SNAP_SETTLE_OFFSET && Math.abs(next.scrollVelocity) < CFG.SNAP_SETTLE_VELOCITY;
    if (settled) {
      const entry = snapEntry.current ?? closestToCenter(list);
      const id = SLIDES[entry.dataIndex].id;
      if (selectOnSnap.current && snapEntry.current && tabletRef.current) {
        requestSlideSelection(id);
        selectOnSnap.current = false;
        snapEntry.current = null;
      } else if (selectCenteredOnSettle.current && tabletRef.current) {
        requestSlideSelection(id);
        selectCenteredOnSettle.current = false;
      }
    }

    barrel.current = stepCarouselBarrel(barrel.current, scrollVelocity.current, input, hadInput, dt);
    const viewportWidth = 2 * Math.tan((perspective.fov * Math.PI) / 180 / 2) * perspective.position.z * (size.width / size.height);

    list.forEach((entry) => {
      let x = entry.baseOffsetX + globalOffset.current;
      if (x > halfRing) {
        entry.baseOffsetX -= ringWidth;
        x -= ringWidth;
        shiftEntryData(entry, 1);
      } else if (x < -halfRing) {
        entry.baseOffsetX += ringWidth;
        x += ringWidth;
        shiftEntryData(entry, -1);
      }
      entry.mesh.position.x = x;
      entry.uniforms.uBarrelStrength.value = barrel.current;
      entry.uniforms.uMeshX.value = x;
      entry.uniforms.uMeshWidth.value = width;
      entry.uniforms.uViewportWidth.value = viewportWidth;
      if (entry.isShowingHover && entry.hoverType === "video" && videoReady(entry.videoElement)) entry.videoTexture.needsUpdate = true;
    });

    const centered = closestToCenter(list);
    const centeredId = SLIDES[centered.dataIndex].id;
    const activeId = pendingRef.current !== undefined ? pendingRef.current : currentRef.current;
    list.forEach((entry) => {
      const id = SLIDES[entry.dataIndex].id;
      setHoverVisible(entry, activeId !== null && id === activeId && entry === centered);
    });

    if (lastCenteredId.current !== centeredId) {
      const hasSnapTarget = snapEntry.current !== null;
      const nothingSelected = currentRef.current === null && pendingRef.current === undefined;
      if (initialised.current && !tabletRef.current && !hasSnapTarget && !nothingSelected) requestSlideSelection(null);
      lastCenteredId.current = centeredId;
      initialised.current = true;
      setCenteredSlideId(centeredId);
    }

    list.forEach((entry) => {
      stepGridDistortion(entry.dataTexture, entry.mouseState);
      entry.uniforms.uDataTexture.value = entry.dataTexture;
    });
  });

  return null;
}

/** Full-screen WebGL carousel of the selected works. */
export default function WorkCarousel() {
  const profile = getGraphicsProfile();
  const isTablet = useMediaQuery(maxWidth(bp.tabletLandscape));
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 5] }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        dpr={Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, profile.dpr)}
        frameloop="always"
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <CarouselScene isTablet={isTablet} />
        </Suspense>
      </Canvas>
    </div>
  );
}
