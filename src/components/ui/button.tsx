"use client";

import { forwardRef, useEffect, useRef } from "react";
import clsx from "clsx";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { bp, minWidth } from "@/lib/breakpoints";
import { syncButtonSvg } from "@/lib/button-svg";
import { useGlobalStore } from "@/stores/global-store";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Skip the scroll-triggered outline draw-in (the hero handles it itself). */
  noAnimation?: boolean;
}

/**
 * Pill button whose outline is an SVG stroke that draws itself in on scroll,
 * with the label sliding up from a masked line.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, noAnimation, className, ...rest }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const rectRef = useRef<SVGRectElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const strokeTweenRef = useRef<gsap.core.Tween | null>(null);
    const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);

    useEffect(() => {
      const button = buttonRef.current;
      const svg = svgRef.current;
      const rect = rectRef.current;
      if (!button || !svg || !rect || !fontsLoaded) return;
      const sync = (preserve: boolean) => {
        syncButtonSvg(button, svg, rect, { preserveProgress: preserve });
        if (preserve) {
          strokeTweenRef.current?.invalidate();
          ScrollTrigger.refresh();
        }
      };
      sync(false);
      let raf = 0;
      const schedule = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => sync(true));
      };
      const ro = new ResizeObserver(schedule);
      ro.observe(button);
      const mql = window.matchMedia(minWidth(bp.tabletPortrait));
      mql.addEventListener("change", schedule);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        mql.removeEventListener("change", schedule);
      };
    }, [fontsLoaded]);

    useEffect(() => {
      if (noAnimation) return;
      const button = buttonRef.current;
      const rect = rectRef.current;
      const label = labelRef.current;
      if (!button || !rect || !label || !fontsLoaded) return;
      const split = new SplitText(label, {
        type: "lines",
        mask: "lines",
        linesClass: "overflow-hidden",
        tag: "div",
      });
      gsap.set(split.lines, { yPercent: 320, rotate: 10 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: button, start: "top 90%", end: "bottom 80%", scrub: 1 },
      });
      tl.to(rect, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" });
      tl.fromTo(
        button,
        { backgroundColor: "rgba(255,255,255,0)" },
        { backgroundColor: "rgba(255,255,255,0.04)" },
      );
      tl.to(split.lines, { yPercent: 0, rotate: 0, duration: 0.4, ease: "power3.out" }, "-=0.25");
      strokeTweenRef.current = tl.getChildren()[0] as gsap.core.Tween;
      ScrollTrigger.refresh();
      return () => {
        strokeTweenRef.current = null;
        tl.scrollTrigger?.kill();
        tl.kill();
        split.revert();
      };
    }, [fontsLoaded, noAnimation]);

    return (
      <button
        {...rest}
        ref={(el) => {
          buttonRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        data-event="hover"
        className={clsx(
          "relative transition-bg duration-300 h-10 tablet-portrait:h-12 px-4 tablet-portrait:px-6 rounded-circular cursor-pointer backdrop-blur-sm",
          className,
        )}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect
            ref={rectRef}
            className="stroke-brand-05/20"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            fill="none"
          />
        </svg>
        <span ref={labelRef} className="relative block">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
