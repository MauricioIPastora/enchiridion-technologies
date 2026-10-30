import { create } from "zustand";
import type Lenis from "lenis";
import { ScrollTrigger } from "@/lib/gsap";

let lockCount = 0;

function lockDocument() {
  if (typeof document === "undefined") return;
  lockCount += 1;
  if (lockCount > 1) return;
  document.documentElement.classList.add("scroll-locked");
  document.body.classList.add("scroll-locked");
}

function unlockDocument() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.documentElement.classList.remove("scroll-locked");
  document.body.classList.remove("scroll-locked");
}

interface ScrollState {
  lenis: Lenis | null;
  enabled: boolean;
  setLenis: (lenis: Lenis | null) => void;
  stopScroll: () => void;
  startScroll: () => void;
}

export const useScrollStore = create<ScrollState>((set, get) => ({
  lenis: null,
  enabled: true,
  setLenis: (lenis) => set({ lenis }),
  stopScroll: () => {
    get().lenis?.stop();
    lockDocument();
    set({ enabled: false });
  },
  startScroll: () => {
    unlockDocument();
    get().lenis?.start();
    set({ enabled: true });
  },
}));

interface ScrollMotionState {
  velocity: number;
  setVelocity: (v: number) => void;
}

export const useScrollMotionStore = create<ScrollMotionState>((set) => ({
  velocity: 0,
  setVelocity: (velocity) => set({ velocity }),
}));

export function stopScroll() {
  useScrollStore.getState().stopScroll();
}

export function startScroll() {
  useScrollStore.getState().startScroll();
}

export function resetScrollToTop() {
  useScrollMotionStore.getState().setVelocity(0);
  const lenis = useScrollStore.getState().lenis;
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  ScrollTrigger.update();
}

/** Smoothly scrolls to an in-page anchor (hash) through Lenis. */
export function scrollToHash(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  const lenis = useScrollStore.getState().lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  } else {
    target.scrollIntoView({ behavior: "smooth" });
  }
}
