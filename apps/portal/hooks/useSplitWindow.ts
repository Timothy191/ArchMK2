"use client";

import { create } from "zustand";

interface SplitWindowState {
  isOpen: boolean;
  activeService: "github" | "whatsapp" | null;
  openService: (_service: "github" | "whatsapp") => void;
  close: () => void;
  toggleService: (_service: "github" | "whatsapp") => void;
}

export const useSplitWindow = create<SplitWindowState>((set) => ({
  isOpen: false,
  activeService: null,
  openService: (service) => set({ isOpen: true, activeService: service }),
  close: () => set({ isOpen: false, activeService: null }),
  toggleService: (service) =>
    set((state) => {
      if (state.isOpen && state.activeService === service) {
        return { isOpen: false, activeService: null };
      }
      return { isOpen: true, activeService: service };
    }),
}));
