"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { registerTickerCallback } from "@/lib/ticker";
import { markClientNavigation } from "@/lib/page-transitions";
import { resetScrollToTop, useScrollMotionStore, useScrollStore } from "@/stores/scroll-store";
import { useGlobalStore } from "@/stores/global-store";

/* ------------------------------------------------------------------ */
/* Lenis smooth scroll                                                 */
/* ------------------------------------------------------------------ */

function LenisProvider({ children }: { children: React.ReactNode }) {
  const setLenis = useScrollStore((s) => s.setLenis);
  const setVelocity = useScrollMotionStore((s) => s.setVelocity);
  const menuOpen = useGlobalStore((s) => s.menuOpen);
  const isLoading = useGlobalStore((s) => s.isLoading);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false, smoothWheel: true });
    lenis.on("scroll", ({ velocity, direction }) => {
      setVelocity(velocity * direction);
      if (Math.abs(velocity) > 0.01) useGlobalStore.getState().closeContactFormIfOpen();
    });
    const unregister = registerTickerCallback(({ timeMs }) => lenis.raf(timeMs));
    lenisRef.current = lenis;
    setLenis(lenis);
    resetScrollToTop();
    if (useGlobalStore.getState().isLoading) lenis.stop();

    lenis.on("scroll", ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
      getBoundingClientRect: () => ({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }),
      pinType: document.documentElement.style.transform ? "transform" : "fixed",
    });
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      ScrollTrigger.scrollerProxy(document.documentElement, {});
      unregister();
      lenis.destroy();
      setLenis(null);
      lenisRef.current = null;
      setVelocity(0);
    };
  }, [setLenis, setVelocity]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    const { enabled } = useScrollStore.getState();
    if (!enabled || menuOpen || isLoading) lenis.stop();
    else lenis.start();
  }, [menuOpen, isLoading]);

  return <>{children}</>;
}

/* ------------------------------------------------------------------ */
/* Fonts + scroll text animations                                      */
/* ------------------------------------------------------------------ */

type TriggerDefaults = {
  start?: string;
  end?: string;
  scrub?: number | boolean;
  markers?: boolean;
  toggleActions?: string;
  pin?: boolean;
};

function withSide(value: string, side: "top" | "bottom") {
  return value.startsWith("top ") || value.startsWith("bottom ") || value.includes(" ") ? value : `${side} ${value}`;
}

function parseBool(raw: string | undefined) {
  if (raw === undefined) return undefined;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return undefined;
}

/** Builds ScrollTrigger vars from data-* attributes with sensible defaults. */
function triggerFromDataset(el: HTMLElement, defaults: TriggerDefaults = {}): ScrollTrigger.Vars {
  const start = withSide(el.dataset.start ?? defaults.start ?? "top 90%", "top");
  const endRaw = el.dataset.end ?? defaults.end;
  const end = endRaw ? withSide(endRaw, "bottom") : undefined;
  let scrub: number | boolean | undefined;
  const scrubRaw = el.dataset.scrub;
  if (scrubRaw !== undefined) {
    if (scrubRaw === "" || scrubRaw === "false" || scrubRaw === "0") scrub = undefined;
    else if (scrubRaw === "true") scrub = true;
    else {
      const n = Number(scrubRaw);
      scrub = Number.isNaN(n) ? true : n;
    }
  } else if (defaults.scrub !== undefined) {
    scrub = defaults.scrub;
  }
  const markers = parseBool(el.dataset.markers) ?? defaults.markers ?? false;
  const triggerSelector = el.dataset.trigger?.trim();
  const vars: ScrollTrigger.Vars = {
    trigger: triggerSelector ? (document.querySelector(triggerSelector) ?? el) : el,
    start,
    markers,
  };
  if (end) vars.end = end;
  if (scrub !== undefined) vars.scrub = scrub;
  const toggle = el.dataset.toggleActions ?? defaults.toggleActions;
  if (toggle) vars.toggleActions = toggle;
  if (parseBool(el.dataset.pin) ?? defaults.pin) vars.pin = true;
  const pinSpacing = parseBool(el.dataset.pinSpacing);
  if (pinSpacing !== undefined) vars.pinSpacing = pinSpacing;
  if (el.dataset.scroller) {
    const scroller = document.querySelector(el.dataset.scroller);
    if (scroller) vars.scroller = scroller;
  }
  return vars;
}

function useFontsLoaded() {
  const setFontsLoaded = useGlobalStore((s) => s.setFontsLoaded);
  useEffect(() => {
    const done = () => {
      setFontsLoaded(true);
      document.body.classList.add("fonts-loaded");
    };
    if (!document.fonts || document.fonts.status === "loaded") {
      done();
      return;
    }
    const timer = setTimeout(done, 800);
    const finish = () => {
      clearTimeout(timer);
      done();
    };
    document.fonts.ready.then(finish);
    document.fonts.addEventListener("loadingdone", finish);
    return () => {
      clearTimeout(timer);
      document.fonts.removeEventListener("loadingdone", finish);
    };
  }, [setFontsLoaded]);
}

/**
 * Global scroll-text system: `.js-s-print-opacity`, `.js-s-lines`,
 * `.js-s-fade-in`, `.js-s-fade-out`, `.js-s-fade-in-out`, `.js-s-blur`,
 * `.js-s-print-blur` — all configurable through data-start / data-end /
 * data-scrub attributes.
 */
function useScrollTextAnimations() {
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const pathname = usePathname();
  useEffect(() => {
    if (!fontsLoaded) return;
    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>(".js-s-print-opacity").forEach((el) => {
        const split = new SplitText(el, { type: "chars,words,lines", tag: "span" });
        splits.push(split);
        const fromZero = el.dataset.startFromZero === "true";
        const scrub = el.dataset.scrub ? Number(el.dataset.scrub) : 1;
        gsap.fromTo(
          split.chars,
          { opacity: fromZero ? 0 : 0.1 },
          {
            keyframes: [{ opacity: 0.4 }, { opacity: 0.6 }, { opacity: 0.8 }, { opacity: 1 }],
            stagger: 0.02,
            ease: "power1.inOut",
            duration: 0.2,
            scrollTrigger: triggerFromDataset(el, { scrub, start: "top 90%", end: "bottom 70%" }),
          },
        );
      });
      document.querySelectorAll<HTMLElement>(".js-s-print-blur").forEach((el) => {
        const split = new SplitText(el, { type: "chars,words,lines", tag: "span" });
        splits.push(split);
        const tl = gsap.timeline({
          scrollTrigger: { ...triggerFromDataset(el, { start: "90%" }), scrub: 1, start: "top 60%", end: "bottom 80%" },
        });
        tl.fromTo(
          split.chars,
          { opacity: 0, filter: "blur(10px)" },
          { opacity: 1, filter: "blur(0px)", stagger: 0.3, duration: 3, ease: "none" },
        );
        tl.to({}, { duration: 2 });
      });
      document.querySelectorAll<HTMLElement>(".js-s-blur").forEach((el) => {
        const split = new SplitText(el, { type: "chars,words,lines", tag: "span" });
        splits.push(split);
        gsap.from(split.words, {
          opacity: 0,
          filter: "blur(15px)",
          duration: 0.4,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: triggerFromDataset(el, { start: "90%" }),
        });
      });
      document.querySelectorAll<HTMLElement>(".js-s-fade-in").forEach((el) => {
        const delay = Number(el.dataset.delay || 0);
        const scrub = el.dataset.scrub ? Number(el.dataset.scrub) : 1;
        const start = el.dataset.start || "top 80%";
        const end = el.dataset.end || "bottom 80%";
        const markers = !!el.dataset.markers;
        const scale = Number(el.dataset.scale) === 0 ? 0 : 1;
        gsap
          .timeline({ scrollTrigger: triggerFromDataset(el, { start, end, scrub, markers }) })
          .fromTo(el, { opacity: 0, scale }, { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }, delay);
      });
      document.querySelectorAll<HTMLElement>(".js-s-fade-out").forEach((el) => {
        const delay = Number(el.dataset.delay || 0);
        const scrub = el.dataset.scrub ? Number(el.dataset.scrub) : 1;
        const start = el.dataset.start || "";
        const end = el.dataset.end || "";
        const markers = !!el.dataset.markers;
        const scale = Number(el.dataset.scale) === 0 ? 0 : 1;
        gsap
          .timeline({ scrollTrigger: triggerFromDataset(el, { start, end, scrub, markers }) })
          .fromTo(el, { opacity: 1, scale: 1 }, { opacity: 0, scale, duration: 1, ease: "power3.out" }, delay);
      });
      document.querySelectorAll<HTMLElement>(".js-s-fade-in-out").forEach((el) => {
        const tl = gsap.timeline({
          scrollTrigger: { ...triggerFromDataset(el, { start: "80%" }), scrub: true, start: "top 70%", end: "bottom 30%" },
          defaults: { duration: 2 },
        });
        tl.fromTo(el, { opacity: 0 }, { opacity: 1 });
        tl.to({}, { duration: 2 });
        tl.to(el, { opacity: 0 });
      });
      document.querySelectorAll<HTMLElement>(".js-s-lines").forEach((el) => {
        const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
        splits.push(split);
        const scale = Number(el.dataset.scale) || 1;
        gsap.fromTo(
          split.lines,
          { yPercent: 320, scale, rotate: 10 },
          {
            yPercent: 0,
            scale: 1,
            rotate: 0,
            stagger: 0.07,
            duration: 0.4,
            ease: "power3.out",
            scrollTrigger: triggerFromDataset(el, { start: "90%", scrub: 1, end: "bottom 60%" }),
          },
        );
      });
    });
    ScrollTrigger.refresh();
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [fontsLoaded, pathname]);
}

function FontsAndScrollAnimations({ children }: { children: React.ReactNode }) {
  useFontsLoaded();
  useScrollTextAnimations();
  return <>{children}</>;
}

/* ------------------------------------------------------------------ */
/* Scroll restoration + wheel input                                    */
/* ------------------------------------------------------------------ */

function ScrollRestoration() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    resetScrollToTop();
  }, []);
  useLayoutEffect(() => {
    resetScrollToTop();
  }, [pathname]);
  useEffect(() => {
    const onPop = () => {
      markClientNavigation();
      resetScrollToTop();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetScrollToTop();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);
  return null;
}

function WheelInput() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest?.("[data-lenis-prevent]")) useGlobalStore.getState().closeContactFormIfOpen();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <WheelInput />
      <FontsAndScrollAnimations>
        <ScrollRestoration />
        {children}
      </FontsAndScrollAnimations>
    </LenisProvider>
  );
}
