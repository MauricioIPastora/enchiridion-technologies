"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { bp, minWidth } from "@/lib/breakpoints";
import { syncButtonSvg } from "@/lib/button-svg";
import {
  animateDissolveIn,
  consumePendingHash,
  hasClientNavigatedOnce,
  killParticleTransitionTweens,
  normalizeRoutePath,
  preparePageContentForEntry,
  resetPageExitTransition,
  revealPageContent,
  routeHasParticles,
  shouldRunEntryDissolve,
} from "@/lib/page-transitions";
import { resetScrollToTop, scrollToHash, startScroll, stopScroll } from "@/stores/scroll-store";
import { useGlobalStore } from "@/stores/global-store";
import { PARTICLE } from "@/components/gl/particle-config";
import {
  applyGeometryConfig,
  copyVec3,
  isGeometryElement,
  particleScrollState,
  queryDissolveElements,
  queryGeometryElements,
  readDissolveConfig,
  readGeometryConfig,
  readGeometryDissolveInConfig,
  reinitializeParticleFieldForRoute,
  regenerateParticleSpawnLayout,
  shapeMorphFor,
  vec3Equal,
} from "@/components/gl/particle-state";

const DEG = Math.PI / 180;
const ROTATION_START = PARTICLE.GEOMETRY_SCROLL_ROTATION_START_DEGREES * DEG;
const CHAR_KEYFRAMES = [{ opacity: 0.4 }, { opacity: 0.6 }, { opacity: 0.8 }, { opacity: 1 }];

const HOME_HERO = "[data-home-hero]";
const ABOUT_HERO = "[data-about-hero]";

let homeEntrance: gsap.core.Timeline | null = null;
let aboutEntrance: gsap.core.Timeline | null = null;

function nextFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

/** Resets the shared particle state from the first [data-geometry] on the page. */
function resetParticleStateForRoute() {
  const els = queryGeometryElements();
  if (els.length > 0) {
    applyGeometryConfig(readGeometryConfig(els[0]));
  } else {
    particleScrollState.shapeTarget = "logo";
    particleScrollState.shapeMorph = 0;
    copyVec3(particleScrollState.geometryScale, { x: 1, y: 1, z: 1 });
    copyVec3(particleScrollState.geometryPosition, { x: 0, y: 0, z: 0 });
    copyVec3(particleScrollState.geometryRotation, { x: 0, y: 0, z: 0 });
    particleScrollState.shapeMorphUseFlight = true;
  }
  particleScrollState.geometryScrollRotationY = ROTATION_START;
  particleScrollState.dissolve = 0;
  particleScrollState.rFormation = 0;
  particleScrollState.pageDissolveOut = false;
}

/** Puts the particles in their scattered state before the entrance plays. */
function primeHero(selector: string) {
  const hero = document.querySelector<HTMLElement>(selector);
  if (!hero) return;
  applyGeometryConfig(readGeometryConfig(hero));
  particleScrollState.dissolve = 1;
}

/** Splits a paragraph into masked lines ready to slide in. */
function prepareLines(
  el: HTMLElement,
  { transformOrigin = "left center", yPercent = 320, rotate = 10 } = {},
) {
  el.classList.remove("opacity-0");
  gsap.set(el, { opacity: 1 });
  void el.offsetWidth;
  const justify = getComputedStyle(el).textAlign === "justify";
  const height = el.getBoundingClientRect().height;
  const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
  const count = split.lines.length;
  const lineHeight = count > 0 ? `${height / count}px` : "";
  split.lines.forEach((line, i) => {
    const l = line as HTMLElement;
    if (lineHeight) {
      l.style.lineHeight = lineHeight;
      l.style.height = lineHeight;
    }
    if (justify) {
      l.style.width = "100%";
      l.style.textAlign = "justify";
      l.style.textAlignLast = i === count - 1 ? "start" : "justify";
    }
  });
  if (lineHeight) (split.masks as HTMLElement[]).forEach((m) => (m.style.height = lineHeight));
  gsap.set(split.lines, { yPercent, rotate, transformOrigin });
  return split;
}

function prepareHeroButton(button: HTMLElement) {
  const svg = button.querySelector("svg");
  const rect = button.querySelector("rect");
  const label = button.querySelector("span");
  if (!svg || !rect || !label) return null;
  button.classList.remove("invisible");
  const perimeter = syncButtonSvg(button, svg, rect);
  if (!perimeter) return null;
  gsap.set(button, { backgroundColor: "rgba(255,255,255,0)" });
  const split = new SplitText(label, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
  gsap.set(split.lines, { yPercent: 320, rotate: 10 });
  return { rect, split, perimeter };
}

function killHomeEntrance() {
  homeEntrance?.kill();
  homeEntrance = null;
  startScroll();
}

function killAboutEntrance() {
  aboutEntrance?.kill();
  aboutEntrance = null;
  startScroll();
}

async function runHomeEntrance() {
  killHomeEntrance();
  const hero = document.querySelector<HTMLElement>(HOME_HERO);
  if (!hero) return;
  applyGeometryConfig(readGeometryConfig(hero));
  particleScrollState.dissolve = 1;
  regenerateParticleSpawnLayout();

  const title = hero.querySelector<HTMLElement>("[data-home-hero-title]");
  const label = hero.querySelector<HTMLElement>("[data-home-hero-label]");
  const description = hero.querySelector<HTMLElement>("[data-home-hero-description]");
  const ctas = Array.from(hero.querySelectorAll<HTMLElement>("[data-home-hero-cta]"));

  stopScroll();
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
  await nextFrame();
  await nextFrame();
  revealPageContent();

  let titleSplit: SplitText | null = null;
  let labelSplit: SplitText | null = null;
  let descSplit: SplitText | null = null;
  if (title) {
    title.classList.remove("opacity-0");
    gsap.set(title, { opacity: 1 });
    titleSplit = new SplitText(title, { type: "chars,words,lines", tag: "span" });
    gsap.set(titleSplit.chars, { opacity: 0 });
  }
  if (label) labelSplit = prepareLines(label, { transformOrigin: "left top" });
  if (description) descSplit = prepareLines(description, { transformOrigin: "left top", yPercent: 200, rotate: 4 });
  const buttons = ctas
    .map((button) => {
      const prepared = prepareHeroButton(button);
      return prepared ? { button, ...prepared } : null;
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      delay: 0.3,
      onComplete: () => {
        title?.classList.remove("opacity-0");
        label?.classList.remove("opacity-0");
        description?.classList.remove("opacity-0");
        titleSplit?.revert();
        labelSplit?.revert();
        descSplit?.revert();
        buttons.forEach(({ split, button }) => {
          split.revert();
          button.classList.remove("invisible");
        });
        homeEntrance = null;
        startScroll();
        resolve();
      },
    });
    homeEntrance = tl;
    tl.to(particleScrollState, { dissolve: 0, duration: 2, ease: "none" }, 0);
    if (titleSplit) {
      tl.fromTo(
        titleSplit.chars,
        { opacity: 0 },
        { keyframes: [...CHAR_KEYFRAMES], stagger: 0.02, ease: "none", duration: 0.2 },
        0,
      );
    }
    if (labelSplit) {
      tl.to(labelSplit.lines, { yPercent: 0, rotate: 0, stagger: 0.07, duration: 0.4, ease: "power3.out" }, 0);
    }
    if (descSplit) {
      tl.to(descSplit.lines, { yPercent: 0, rotate: 0, stagger: 0.07, duration: 0.4, ease: "power3.out" }, 0.3);
    }
    if (buttons.length) {
      tl.to(buttons.map((b) => b.rect), { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.4 }, 0);
      tl.to(
        buttons.map((b) => b.button),
        { backgroundColor: "rgba(255,255,255,0.04)", duration: 0.7, ease: "none", stagger: 0.4 },
        0,
      );
      tl.to(
        buttons.flatMap((b) => b.split.lines),
        { yPercent: 0, rotate: 0, duration: 0.4, ease: "power3.out", stagger: 0.4 },
        0.3,
      );
    }
  });
}

async function runAboutEntrance({ animateParticles = true } = {}) {
  killAboutEntrance();
  const hero = document.querySelector<HTMLElement>(ABOUT_HERO);
  if (!hero) return;
  applyGeometryConfig(readGeometryConfig(hero));
  particleScrollState.dissolve = 1;
  if (animateParticles) regenerateParticleSpawnLayout();
  const title = hero.querySelector<HTMLElement>("[data-about-hero-title]");
  let split: SplitText | null = null;
  revealPageContent();
  if (title) {
    title.classList.remove("opacity-0");
    gsap.set(title, { opacity: 1 });
    split = new SplitText(title, { type: "chars,words,lines", tag: "span" });
    gsap.set(split.chars, { opacity: 0 });
  }
  stopScroll();
  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        title?.classList.remove("opacity-0");
        split?.revert();
        aboutEntrance = null;
        startScroll();
        resolve();
      },
    });
    aboutEntrance = tl;
    if (animateParticles) tl.to(particleScrollState, { dissolve: 0, duration: 2, ease: "none" }, 0);
    if (split) {
      tl.fromTo(split.chars, { opacity: 0 }, { keyframes: [...CHAR_KEYFRAMES], stagger: 0.02, ease: "none", duration: 0.2 }, 0);
    }
  });
}

/** Finds where the scroll-driven spin should end (first non-geometry dissolve-in, etc.). */
function resolveRotationEnd(geometryEls: HTMLElement[]) {
  const plainIns = queryDissolveElements("in").filter((el) => !isGeometryElement(el));
  if (plainIns.length > 0) {
    return { endEl: plainIns[0], end: readDissolveConfig(plainIns[0], "in").start };
  }
  const geometryIns = queryDissolveElements("in").filter((el) => isGeometryElement(el));
  if (geometryIns.length > 0) {
    const last = geometryIns[geometryIns.length - 1];
    return { endEl: last, end: readGeometryDissolveInConfig(last).end };
  }
  const outs = queryDissolveElements("out");
  if (outs.length > 0) {
    return { endEl: outs[0], end: readDissolveConfig(outs[0], "out").end };
  }
  return { endEl: geometryEls[geometryEls.length - 1], end: "bottom top" };
}

function rotationEndRadians() {
  const el = document.querySelector<HTMLElement>("[data-geometry-scroll-rotation-end-degrees]");
  const raw = el?.dataset.geometryScrollRotationEndDegrees;
  const deg = raw !== undefined && raw !== "" ? Number(raw) : NaN;
  return (Number.isFinite(deg) ? deg : PARTICLE.GEOMETRY_SCROLL_ROTATION_END_DEGREES) * DEG;
}

type GeometryConfig = ReturnType<typeof readGeometryConfig>;

/**
 * Scrubbed timeline that tweens the shared state (and its nested vectors)
 * from one geometry config to another.
 */
function geometryTransition(
  from: GeometryConfig | null,
  to: GeometryConfig,
  extra: { from?: gsap.TweenVars; to?: gsap.TweenVars },
  scrollTrigger: ScrollTrigger.Vars,
) {
  const tl = gsap.timeline({ defaults: { ease: "none", immediateRender: false }, scrollTrigger });
  const state = particleScrollState;
  const scalar = (
    target: object,
    fromVars: gsap.TweenVars | undefined,
    toVars: gsap.TweenVars,
  ) => {
    if (fromVars) tl.fromTo(target, fromVars, toVars, 0);
    else tl.to(target, toVars, 0);
  };
  scalar(
    state,
    from ? { shapeMorph: shapeMorphFor(from.target), shapeMorphUseFlight: to.entryAnimation, ...extra.from } : undefined,
    { shapeMorph: shapeMorphFor(to.target), shapeMorphUseFlight: to.entryAnimation, ...extra.to },
  );
  scalar(state.geometryScale, from ? { ...from.geometryScale } : undefined, { ...to.geometryScale });
  scalar(state.geometryPosition, from ? { ...from.geometryPosition } : undefined, { ...to.geometryPosition });
  scalar(state.geometryRotation, from ? { ...from.geometryRotation } : undefined, { ...to.geometryRotation });
  return tl;
}

function buildScrollTriggers({ geometryParticles, footerParticles }: { geometryParticles: boolean; footerParticles: boolean }) {
  const ctx = gsap.context(() => {
    if (geometryParticles) {
      const els = queryGeometryElements();
      if (els.length > 0) {
        applyGeometryConfig(readGeometryConfig(els[0]));
        // Morph between consecutive geometry sections.
        for (let i = 0; i < els.length - 1; i++) {
          const from = readGeometryConfig(els[i]);
          const to = readGeometryConfig(els[i + 1]);
          if (
            shapeMorphFor(from.target) === shapeMorphFor(to.target) &&
            vec3Equal(from.geometryScale, to.geometryScale) &&
            vec3Equal(from.geometryPosition, to.geometryPosition) &&
            vec3Equal(from.geometryRotation, to.geometryRotation)
          ) {
            continue;
          }
          geometryTransition(from, to, {}, {
            trigger: els[i + 1],
            start: to.start,
            end: to.end,
            scrub: to.scrub,
            markers: to.markers,
            invalidateOnRefresh: true,
          });
        }
        // Spin with scroll.
        const { endEl, end } = resolveRotationEnd(els);
        gsap.fromTo(
          particleScrollState,
          { geometryScrollRotationY: ROTATION_START },
          {
            geometryScrollRotationY: rotationEndRadians(),
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: els[0],
              start: PARTICLE.GEOMETRY_SCROLL_ROTATION_SCROLL_START,
              endTrigger: endEl,
              end,
              scrub: PARTICLE.GEOMETRY_SCROLL_ROTATION_SCRUB,
              invalidateOnRefresh: true,
            },
          },
        );
        // Dissolve out / in.
        for (const el of queryDissolveElements("out")) {
          const c = readDissolveConfig(el, "out");
          gsap.fromTo(
            particleScrollState,
            { dissolve: 0 },
            {
              dissolve: 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: c.start, end: c.end, scrub: c.scrub, markers: c.markers, invalidateOnRefresh: true },
            },
          );
        }
        for (const el of queryDissolveElements("in")) {
          if (!isGeometryElement(el)) continue;
          const c = readGeometryDissolveInConfig(el);
          const config = readGeometryConfig(el);
          geometryTransition(
            config,
            config,
            { from: { dissolve: 1, shapeTarget: config.target }, to: { dissolve: 0, shapeTarget: config.target } },
            { trigger: el, start: c.start, end: c.end, scrub: c.scrub, markers: c.markers, invalidateOnRefresh: true },
          );
        }
      }
    }
    if (footerParticles) {
      for (const el of queryDissolveElements("in")) {
        if (isGeometryElement(el)) continue;
        const c = readDissolveConfig(el, "in");
        gsap.fromTo(
          particleScrollState,
          { rFormation: 0 },
          {
            rFormation: 1,
            dissolve: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: c.start, end: c.end, scrub: c.scrub, markers: c.markers, invalidateOnRefresh: true },
          },
        );
      }
    }
  });
  ScrollTrigger.refresh();
  requestAnimationFrame(() => ScrollTrigger.refresh());
  return ctx;
}

/**
 * Drives the particle entrance per route and wires the scroll-driven
 * morph / spin / dissolve ScrollTriggers from data attributes in the DOM.
 */
export default function ParticleScrollController() {
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const isLoading = useGlobalStore((s) => s.isLoading);
  const pathname = usePathname();
  const route = normalizeRoutePath(pathname);
  const hasParticles = routeHasParticles(pathname);
  const isAbout = route === "/about";
  const isHome = route === "/";
  const ctxRef = useRef<gsap.Context | null>(null);
  const [tabletUp, setTabletUp] = useState(
    () => typeof window !== "undefined" && window.matchMedia(minWidth(bp.tabletPortrait)).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(minWidth(bp.tabletPortrait));
    const update = () => setTabletUp(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const animateParticles = hasParticles && (!isAbout || tabletUp);

  useLayoutEffect(() => {
    preparePageContentForEntry(hasClientNavigatedOnce());
  }, [pathname]);

  useLayoutEffect(() => {
    if (!isLoading) resetScrollToTop();
  }, [pathname, isLoading]);

  useLayoutEffect(() => {
    if (!fontsLoaded || !hasParticles) return;
    if (isAbout) primeHero(ABOUT_HERO);
    if (isHome) primeHero(HOME_HERO);
  }, [fontsLoaded, pathname, isAbout, isHome, hasParticles]);

  useEffect(() => {
    if (!fontsLoaded || isLoading) return;
    let cancelled = false;
    (async () => {
      resetParticleStateForRoute();
      if (isAbout && hasParticles) primeHero(ABOUT_HERO);
      if (isHome && hasParticles) primeHero(HOME_HERO);
      reinitializeParticleFieldForRoute();
      ctxRef.current?.revert();
      ctxRef.current = null;
      if (!hasParticles) {
        if (hasClientNavigatedOnce()) revealPageContent();
        return;
      }
      if (isAbout) {
        await runAboutEntrance({ animateParticles });
        if (cancelled) return;
      } else if (isHome) {
        await runHomeEntrance();
        if (cancelled) return;
      } else if (shouldRunEntryDissolve(animateParticles)) {
        await animateDissolveIn();
        if (cancelled) return;
      } else if (hasClientNavigatedOnce()) {
        revealPageContent();
      }
      ctxRef.current = buildScrollTriggers({ geometryParticles: animateParticles, footerParticles: hasParticles });
      const hash = consumePendingHash();
      if (hash) requestAnimationFrame(() => scrollToHash(hash));
    })();
    return () => {
      cancelled = true;
      resetPageExitTransition();
      killParticleTransitionTweens();
      killAboutEntrance();
      killHomeEntrance();
      ctxRef.current?.revert();
      ctxRef.current = null;
      resetParticleStateForRoute();
    };
  }, [fontsLoaded, isLoading, pathname, hasParticles, animateParticles, isAbout, isHome]);

  return null;
}
