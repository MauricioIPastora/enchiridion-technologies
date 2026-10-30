import { gsap } from "@/lib/gsap";
import { getGraphicsProfile } from "@/lib/graphics-profile";

export interface TickerFrame {
  timeSec: number;
  timeMs: number;
  deltaMs: number;
}

type TickerCallback = (frame: TickerFrame) => void;

const callbacks = new Set<TickerCallback>();
let attached = false;
let configured = false;
let pageVisible =
  typeof document === "undefined" || document.visibilityState === "visible";

function onTick(time: number, deltaTime: number) {
  if (!pageVisible) return;
  const frame: TickerFrame = { timeSec: time, timeMs: time * 1000, deltaMs: deltaTime };
  for (const cb of callbacks) cb(frame);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    pageVisible = document.visibilityState === "visible";
    if (pageVisible) gsap.ticker.wake();
  });
}

export function isPageVisible() {
  return pageVisible;
}

/** Shares one gsap ticker between Lenis, the cursor and other per-frame work. */
export function registerTickerCallback(cb: TickerCallback) {
  if (!configured) {
    configured = true;
    gsap.ticker.lagSmoothing(0);
    const { maxFps } = getGraphicsProfile();
    gsap.ticker.fps(maxFps > 0 ? maxFps : -1);
  }
  callbacks.add(cb);
  if (!attached) {
    gsap.ticker.add(onTick);
    attached = true;
  }
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0 && attached) {
      gsap.ticker.remove(onTick);
      attached = false;
    }
  };
}
