import { create } from "zustand";

export type CursorType = "default" | "hover" | "simple-hover" | "text" | "drag" | "hide";

interface CursorState {
  pixel: { x: number; y: number };
  normalized: { x: number; y: number };
  active: boolean;
  type: CursorType;
  setCursor: (pixel: { x: number; y: number }, viewport: { width: number; height: number }) => void;
  setActive: (active: boolean) => void;
  setType: (type: CursorType) => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  pixel: { x: 0, y: 0 },
  normalized: { x: 0.5, y: 0.5 },
  active: false,
  type: "default",
  setCursor: (pixel, viewport) =>
    set({
      pixel,
      normalized: { x: pixel.x / viewport.width, y: 1 - pixel.y / viewport.height },
    }),
  setActive: (active) => set({ active }),
  setType: (type) => set({ type }),
}));
