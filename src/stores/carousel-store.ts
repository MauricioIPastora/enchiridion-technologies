import { create } from "zustand";

interface CarouselState {
  /** Slide currently expanded (showing its hover media + details). */
  currentSlideId: string | null;
  /** Slide the user asked for; undefined when no transition is pending. */
  pendingSlideId: string | null | undefined;
  /** Slide closest to the viewport centre. */
  centeredSlideId: string | null;
  requestSlideSelection: (id: string | null) => void;
  commitCurrentSlideId: () => void;
  completeSlideTransition: () => void;
  setCenteredSlideId: (id: string | null) => void;
}

export const useCarouselStore = create<CarouselState>((set, get) => ({
  currentSlideId: null,
  pendingSlideId: undefined,
  centeredSlideId: null,
  requestSlideSelection: (id) => {
    const { currentSlideId, pendingSlideId } = get();
    if (pendingSlideId === id) return;
    if (pendingSlideId === undefined && currentSlideId === id) return;
    set({ pendingSlideId: id });
  },
  commitCurrentSlideId: () => {
    const { pendingSlideId } = get();
    if (pendingSlideId !== undefined) set({ currentSlideId: pendingSlideId });
  },
  completeSlideTransition: () => {
    const { pendingSlideId } = get();
    if (pendingSlideId !== undefined) set({ pendingSlideId: undefined });
  },
  setCenteredSlideId: (centeredSlideId) => set({ centeredSlideId }),
}));

export function formatSlideId(index: number) {
  return `slide-${index + 1}`;
}

export function parseSlideIndex(id: string | null | undefined): number | null {
  if (!id) return null;
  const m = id.match(/slide-(\d+)/);
  if (!m) return null;
  const idx = Number.parseInt(m[1], 10) - 1;
  return Number.isNaN(idx) || idx < 0 ? null : idx;
}
