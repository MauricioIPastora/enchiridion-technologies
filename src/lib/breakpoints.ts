"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const bp = {
  mobileLandscape: 480,
  tabletPortrait: 768,
  tabletLandscape: 1024,
  desktopSM: 1280,
  desktop: 1440,
  desktopLG: 1680,
  wide: 1920,
  ultrawide: 2560,
} as const;

export const maxWidth = (px: number) => `(max-width: ${px}px)`;
export const minWidth = (px: number) => `(min-width: ${px}px)`;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const onChange = useCallback((e: MediaQueryListEvent | MediaQueryList) => {
    setMatches(e.matches);
  }, []);
  const mql = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia(query) : null),
    [query],
  );
  useEffect(() => {
    if (!mql) return;
    mql.addEventListener("change", onChange);
    if (mql.matches) setMatches(true);
    return () => mql.removeEventListener("change", onChange);
  }, [mql, onChange]);
  return matches;
}
