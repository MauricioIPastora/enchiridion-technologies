"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { registerTickerCallback } from "@/lib/ticker";
import { useCursorStore, type CursorType } from "@/stores/cursor-store";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Custom cursor: a crosshair that follows the pointer exactly and a soft
 * ring that lags behind and expands over [data-event="hover"] elements.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const bound = useRef(new WeakSet<HTMLElement>());
  const [finePointer, setFinePointer] = useState(false);
  const [pressed, setPressed] = useState(false);
  const type = useCursorStore((s) => s.type);
  const setType = useCursorStore((s) => s.setType);

  useEffect(() => {
    const mql = window.matchMedia("(pointer: fine)");
    const update = () => setFinePointer(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!finePointer) return;
    bound.current = new WeakSet();
    const bindAll = () => {
      document.querySelectorAll<HTMLElement>("[data-event]").forEach((el) => {
        if (bound.current.has(el)) return;
        bound.current.add(el);
        const kind = el.dataset.event?.toLowerCase() as CursorType | undefined;
        if (!kind || kind === "default") return;
        el.addEventListener("mouseover", () => setType(kind));
        el.addEventListener("mouseleave", () => setType("default"));
      });
    };
    bindAll();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(bindAll, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const { setCursor, setActive } = useCursorStore.getState();
    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      setCursor({ x: e.clientX, y: e.clientY }, { width: window.innerWidth, height: window.innerHeight });
      setActive(true);
    };
    const onLeave = () => setActive(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    smooth.current = {
      x: target.current.x || window.innerWidth / 2,
      y: target.current.y || window.innerHeight / 2,
    };
    const unregister = registerTickerCallback(() => {
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (!dot || !ring) return;
      const { x, y } = target.current;
      const s = smooth.current;
      s.x = lerp(s.x, x, 0.06);
      s.y = lerp(s.y, y, 0.06);
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%)`;
    });
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      unregister();
      setActive(false);
      setPressed(false);
    };
  }, [finePointer, setType]);

  if (!finePointer) return null;

  const hovering = type === "hover" || type === "simple-hover";

  return (
    <>
      <div ref={ringRef} aria-hidden className="pointer-events-none fixed top-0 left-0 z-[100000001]">
        <div
          className={clsx(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 will-change-transform rounded-full border border-brand-05/10 bg-brand-05/4 backdrop-blur-[1px] scale-0 transition-all duration-400",
            { "scale-100": type === "hover" },
          )}
        />
      </div>
      <div
        ref={dotRef}
        aria-hidden
        className={clsx(
          "mix-blend-difference pointer-events-none fixed top-0 left-0 z-[100000002] h-1 w-1 will-change-transform transition-opacity duration-200",
          { "opacity-60!": pressed, "opacity-0!": type === "hide", "opacity-100!": type !== "hide" },
        )}
      >
        <div
          className={clsx("absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-brand-05 transition-all duration-200", {
            "bottom-1/2! translate-y-0!": pressed,
            "-translate-y-full scale-60": hovering,
          })}
        />
        <div
          className={clsx("absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-brand-05 transition-all duration-200", {
            "top-1/2! translate-y-0!": pressed,
            "translate-y-full scale-60": hovering,
          })}
        />
        <div
          className={clsx("absolute top-1/2 left-full -translate-y-1/2 w-1.5 h-0.5 bg-brand-05 transition-all duration-200", {
            "left-1/2! translate-x-0!": pressed,
            "translate-x-full scale-60": hovering,
          })}
        />
        <div
          className={clsx("absolute top-1/2 right-full -translate-y-1/2 w-1.5 h-0.5 bg-brand-05 transition-all duration-200", {
            "right-1/2! translate-x-0!": pressed,
            "-translate-x-full scale-60": hovering,
          })}
        />
      </div>
    </>
  );
}
