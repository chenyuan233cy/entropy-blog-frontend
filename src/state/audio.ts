"use client";

import { create } from "zustand";
import type { Track } from "@/data/types";

interface AudioState {
  open: boolean;
  playing: boolean;
  index: number;
  tracks: Track[];
  volume: number;
  muted: boolean;
  progress: number;
  duration: number;
  ready: boolean;
  prepare: (tracks: Track[]) => void;
  setOpen: (value: boolean) => void;
  setPlaying: (value: boolean) => void;
  toggle: () => void;
  select: (index: number) => void;
  next: () => void;
  previous: () => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  setProgress: (value: number) => void;
  setDuration: (value: number) => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  open: false,
  playing: false,
  index: 0,
  tracks: [],
  volume: 0.65,
  muted: false,
  progress: 0,
  duration: 0,
  ready: false,

  prepare: (tracks) => { if (!get().ready) set({ tracks, ready: true }); },
  setOpen: (value) => set({ open: value }),
  setPlaying: (value) => set({ playing: value }),
  toggle: () => set((state) => ({ playing: !state.playing })),
  select: (index) => set({ index, progress: 0, playing: true }),
  next: () => set((state) => state.tracks.length === 0 ? state : ({
    index: (state.index + 1) % state.tracks.length, progress: 0, playing: true,
  })),
  previous: () => set((state) => state.tracks.length === 0 ? state : ({
    index: (state.index - 1 + state.tracks.length) % state.tracks.length, progress: 0, playing: true,
  })),
  setVolume: (value) => set({ volume: value, muted: value === 0 }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setProgress: (value) => set({ progress: value }),
  setDuration: (value) => set({ duration: value }),
}));
