"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import clsx from "clsx";

type Falloff = "linear" | "exponential" | "gaussian";

interface VariableProximityProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: Falloff;
}

function parseSettings(settings: string) {
  return new Map(
    settings
      .split(",")
      .map((s) => s.trim())
      .map((s) => {
        const [axis, value] = s.split(" ");
        return [axis.replace(/['"]/g, ""), parseFloat(value)] as const;
      }),
  );
}

/**
 * Per-character variable-font weight that reacts to pointer proximity.
 */
const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>(
  (
    {
      label,
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 50,
      falloff = "linear",
      className = "",
      style,
      ...rest
    },
    ref,
  ) => {
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const settingsCache = useRef<string[]>([]);
    const mouse = useRef({ x: 0, y: 0 });
    const lastMouse = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    useEffect(() => {
      const update = (x: number, y: number) => {
        const el = containerRef.current;
        if (el) {
          const r = el.getBoundingClientRect();
          mouse.current = { x: x - r.left, y: y - r.top };
          return;
        }
        mouse.current = { x, y };
      };
      const onMove = (e: MouseEvent) => update(e.clientX, e.clientY);
      const onTouch = (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) update(t.clientX, t.clientY);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onTouch);
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onTouch);
      };
    }, [containerRef]);

    const axes = useMemo(() => {
      const from = parseSettings(fromFontVariationSettings);
      const to = parseSettings(toFontVariationSettings);
      return Array.from(from.entries()).map(([axis, fromValue]) => ({
        axis,
        fromValue,
        toValue: to.get(axis) ?? fromValue,
      }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    const step = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const { x, y } = mouse.current;
      if (lastMouse.current.x === x && lastMouse.current.y === y) return;
      lastMouse.current = { x, y };
      letterRefs.current.forEach((letter, i) => {
        if (!letter) return;
        const lr = letter.getBoundingClientRect();
        const dist = Math.hypot(
          lr.left + lr.width / 2 - rect.left - x,
          lr.top + lr.height / 2 - rect.top - y,
        );
        if (dist >= radius) {
          letter.style.fontVariationSettings = fromFontVariationSettings;
          return;
        }
        const norm = Math.min(Math.max(1 - dist / radius, 0), 1);
        const f =
          falloff === "exponential"
            ? norm ** 2
            : falloff === "gaussian"
              ? Math.exp(-((dist / (radius / 2)) ** 2) / 2)
              : norm;
        const value = axes
          .map(({ axis, fromValue, toValue }) => `'${axis}' ${fromValue + (toValue - fromValue) * f}`)
          .join(", ");
        settingsCache.current[i] = value;
        letter.style.fontVariationSettings = value;
      });
    }, [containerRef, radius, falloff, fromFontVariationSettings, axes]);

    useEffect(() => {
      let raf = 0;
      const loop = () => {
        step();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }, [step]);

    const words = label.split(" ");
    let letterIndex = 0;

    return (
      <span
        ref={ref}
        className={clsx("font-red-hat-display", className)}
        style={{ display: "inline", ...style }}
        {...rest}
      >
        {words.map((word, wi) => (
          <span key={`${word}-${wi}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.split("").map((char) => {
              const idx = letterIndex++;
              return (
                <span
                  key={idx}
                  ref={(el) => {
                    letterRefs.current[idx] = el;
                  }}
                  data-vp-char=""
                  style={{ display: "inline-block", fontVariationSettings: settingsCache.current[idx] }}
                  aria-hidden="true"
                >
                  {char}
                </span>
              );
            })}
            {wi < words.length - 1 && <span style={{ display: "inline-block" }}>&nbsp;</span>}
          </span>
        ))}
        <span className="sr-only">{label}</span>
      </span>
    );
  },
);

VariableProximity.displayName = "VariableProximity";

export default VariableProximity;
