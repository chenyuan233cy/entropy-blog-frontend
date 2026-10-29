"use client";

import { create } from "zustand";

interface PaletteState {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export const usePalette = create<PaletteState>((set) => ({
  open: false,
  setOpen: (value) => set({ open: value }),
}));
