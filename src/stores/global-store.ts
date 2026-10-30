import { create } from "zustand";

interface GlobalState {
  fontsLoaded: boolean;
  setFontsLoaded: (v: boolean) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  showContactForm: boolean;
  setShowContactForm: (v: boolean) => void;
  closeContactFormIfOpen: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}

export const useGlobalStore = create<GlobalState>((set, get) => ({
  fontsLoaded: false,
  setFontsLoaded: (fontsLoaded) => set({ fontsLoaded }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  showContactForm: false,
  setShowContactForm: (showContactForm) => set({ showContactForm }),
  closeContactFormIfOpen: () => {
    if (get().showContactForm) set({ showContactForm: false });
  },
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));
