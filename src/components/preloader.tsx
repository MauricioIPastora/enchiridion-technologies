"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { hasClientNavigatedOnce } from "@/lib/page-transitions";
import { resetScrollToTop, startScroll, stopScroll } from "@/stores/scroll-store";
import { useGlobalStore } from "@/stores/global-store";
import { site } from "@/content/site";

function isFirstLoad() {
  return !hasClientNavigatedOnce();
}

/**
 * First-load curtain: two half-screens with the tagline that split apart
 * after a short hold, then unlock scrolling and start the hero entrance.
 */
export default function Preloader() {
  const setIsLoading = useGlobalStore((s) => s.setIsLoading);
  const lineRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(isFirstLoad);

  useLayoutEffect(() => {
    resetScrollToTop();
    if (isFirstLoad()) stopScroll();
  }, []);

  useEffect(() => {
    if (!isFirstLoad()) {
      resetScrollToTop();
      setIsLoading(false);
      const t = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(t);
    }
    const line = lineRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!line || !left || !right) return;
    gsap.set(line, { clipPath: "inset(100% 0 0 0)" });
    gsap.set(left, { clipPath: "inset(0 50% 0 0)", xPercent: 0 });
    gsap.set(right, { clipPath: "inset(0 0 0 50%)", xPercent: 0 });
    const ease = "power4.inOut";
    const tl = gsap.timeline({
      onComplete: () => {
        resetScrollToTop();
        setIsLoading(false);
        setVisible(false);
        startScroll();
      },
    });
    tl.to({}, { duration: 2 });
    tl.fromTo(line, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.7, ease });
    tl.fromTo(
      left,
      { clipPath: "inset(0 50% 0 0)", xPercent: 0 },
      { clipPath: "inset(0 80% 0 0)", xPercent: -20, duration: 1.9, ease },
      "-=0.1",
    );
    tl.fromTo(
      right,
      { clipPath: "inset(0 0 0 50%)", xPercent: 0 },
      { clipPath: "inset(0 0 0 80%)", xPercent: 20, duration: 1.9, ease },
      "<",
    );
    return () => {
      tl.kill();
      startScroll();
    };
  }, [setIsLoading]);

  if (!visible) return null;

  return (
    <div>
      <div
        ref={leftRef}
        className="overflow-hidden text-brand-05 fixed w-screen h-screen left-0 top-0 z-[10000000] flex items-center justify-center bg-brand-70"
        aria-hidden="true"
        style={{ clipPath: "inset(0 50% 0 0)" }}
      >
        <span className="shiny-text flex heading-2 text-center font-instrument-serif">{site.preloader}</span>
        <div
          ref={lineRef}
          className="absolute top-0 left-1/2 w-px h-screen -translate-x-1/2 bg-brand-05/20"
          style={{ clipPath: "inset(100% 0 0 0)" }}
        />
      </div>
      <div
        ref={rightRef}
        className="overflow-hidden text-brand-05 fixed w-screen h-screen left-0 top-0 z-[10000000] flex items-center justify-center bg-brand-70"
        aria-hidden="true"
        style={{ clipPath: "inset(0 0 0 50%)" }}
      >
        <span className="shiny-text flex heading-2 text-center font-instrument-serif">{site.preloader}</span>
      </div>
    </div>
  );
}
