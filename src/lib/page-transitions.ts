import { gsap } from "@/lib/gsap";
import { PARTICLE } from "@/components/gl/particle-config";
import {
  particleScrollState,
  regenerateParticleSpawnLayout,
} from "@/components/gl/particle-state";
import { resetScrollToTop, startScroll, stopScroll, scrollToHash } from "@/stores/scroll-store";

const PAGE_CONTENT = "[data-page-content]";
const RIG_CANVAS = "[data-rig-canvas]";

/* ------------------------------------------------------------------ */
/* Page content visibility                                             */
/* ------------------------------------------------------------------ */

let exitTweens: gsap.core.Tween[] = [];

export function killPageExitFadeTweens() {
  exitTweens.forEach((t) => t.kill());
  exitTweens = [];
}

export function animatePageExitFade(): Promise<void> {
  killPageExitFadeTweens();
  const els = Array.from(document.querySelectorAll(`${PAGE_CONTENT}, ${RIG_CANVAS}`));
  if (!els.length) return Promise.resolve();
  return new Promise((resolve) => {
    exitTweens = [
      gsap.to(els, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          exitTweens = [];
          resolve();
        },
      }),
    ];
  });
}

export function preparePageContentForEntry(hide: boolean) {
  killPageExitFadeTweens();
  if (!hide) return;
  gsap.set(document.querySelectorAll(PAGE_CONTENT), { opacity: 0 });
}

export function revealPageContent() {
  gsap.set(document.querySelectorAll(PAGE_CONTENT), { clearProps: "opacity" });
}

export function setRigCanvasHidden() {
  const els = document.querySelectorAll(RIG_CANVAS);
  if (els.length) gsap.set(els, { opacity: 0 });
}

export function revealRigCanvas() {
  const els = document.querySelectorAll(RIG_CANVAS);
  if (els.length) gsap.set(els, { clearProps: "opacity" });
}

/* ------------------------------------------------------------------ */
/* Route helpers                                                       */
/* ------------------------------------------------------------------ */

export function normalizeRoutePath(path: string) {
  const parts = path.split("#")[0].split("?")[0].split("/").filter(Boolean);
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

const ROUTES_WITH_PARTICLES = new Set(["/", "/about"]);

export function routeHasParticles(path: string) {
  return ROUTES_WITH_PARTICLES.has(normalizeRoutePath(path));
}

/* ------------------------------------------------------------------ */
/* Client navigation + particle transitions                            */
/* ------------------------------------------------------------------ */

let particleTween: gsap.core.Tween | null = null;
let particleTweenRunning = false;
let navigationInFlight = false;
let clientNavigatedOnce = false;
let pendingHash: string | null = null;

export function markClientNavigation() {
  clientNavigatedOnce = true;
}

export function hasClientNavigatedOnce() {
  return clientNavigatedOnce;
}

export function shouldRunEntryDissolve(hasGeometryParticles: boolean) {
  return clientNavigatedOnce && hasGeometryParticles;
}

export function consumePendingHash() {
  const h = pendingHash;
  pendingHash = null;
  return h;
}

export function killParticleTransitionTweens() {
  particleTween?.kill();
  particleTween = null;
  particleTweenRunning = false;
  startScroll();
}

export function resetPageExitTransition() {
  navigationInFlight = false;
  killPageExitFadeTweens();
}

function tweenDissolve(to: number): Promise<void> {
  killParticleTransitionTweens();
  return new Promise((resolve) => {
    stopScroll();
    particleTweenRunning = true;
    particleTween = gsap.to(particleScrollState, {
      dissolve: to,
      duration: PARTICLE.PAGE_DISSOLVE_DURATION,
      ease: "power2.inOut",
      onComplete: () => {
        particleTween = null;
        particleTweenRunning = false;
        startScroll();
        resolve();
      },
    });
  });
}

async function animateDissolveOut() {
  if (particleScrollState.dissolve >= 0.92) return;
  particleScrollState.pageDissolveOut = true;
  if (particleScrollState.rFormation <= 0.001) regenerateParticleSpawnLayout();
  await tweenDissolve(1);
}

export async function animateDissolveIn() {
  revealPageContent();
  particleScrollState.pageDissolveOut = false;
  particleScrollState.dissolve = 1;
  regenerateParticleSpawnLayout();
  await tweenDissolve(0);
}

/**
 * Intercepts an internal link click. Same-page hash links scroll smoothly;
 * route changes fade the page, dissolve the particles and then navigate.
 * Returns a function that performs the navigation, or null when the click
 * was handled (or should fall through to the browser).
 */
export async function handleParticleTransitionClick(
  e: React.MouseEvent,
  href: string,
  currentPath: string,
  navigate: () => void,
): Promise<(() => void) | null> {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return null;
  }
  const [pathPart, hash] = href.split("#");
  const targetPath = normalizeRoutePath(pathPart || "/");
  const samePage = normalizeRoutePath(currentPath) === targetPath;

  if (samePage) {
    e.preventDefault();
    if (hash) {
      scrollToHash(`#${hash}`);
    } else {
      const lenis = (await import("@/stores/scroll-store")).useScrollStore.getState().lenis;
      if (lenis) lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return null;
  }

  e.preventDefault();
  if (particleTweenRunning || navigationInFlight) return null;

  pendingHash = hash ? `#${hash}` : null;
  const dissolve = routeHasParticles(currentPath) && particleScrollState.dissolve < 0.92;
  navigationInFlight = true;
  const steps: Promise<void>[] = [animatePageExitFade()];
  if (dissolve) steps.push(animateDissolveOut());
  await Promise.all(steps);
  navigationInFlight = false;
  markClientNavigation();
  resetScrollToTop();
  return navigate;
}
