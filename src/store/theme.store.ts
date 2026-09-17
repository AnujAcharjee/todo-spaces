"use client";

import { create } from "zustand";
import { get, set, del } from "idb-keyval";

const DB_BG_KEY = "todo_spaces_custom_bg";
export const DEFAULT_BG = "/bg-sunset.jpg";

export const PRESET_BACKGROUNDS = [
  {
    id: "sunset",
    name: "Golden Dusk (Default)",
    url: "/bg-sunset.jpg",
    preview: "/bg-sunset.jpg",
  },
  {
    id: "aurora-night",
    name: "Aurora Lake",
    url: "/bg-night.jpg",
    preview: "/bg-night.jpg",
  },
  {
    id: "aurora-norway",
    name: "Northern Lights",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2000&q=80",
    preview: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "cozy-dark",
    name: "Night Skyline",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80",
    preview: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "anime-sky",
    name: "Pastel Sky",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=80",
    preview: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "deep-space",
    name: "Cosmic Nebula",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2000&q=80",
    preview: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80",
  },
];

interface ThemeState {
  backgroundUrl: string;
  isCustom: boolean;
  isLoading: boolean;
  loadBackground: () => Promise<void>;
  setBackground: (url: string, isCustomUpload?: boolean) => Promise<void>;
  resetBackground: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((setState) => ({
  backgroundUrl: DEFAULT_BG,
  isCustom: false,
  isLoading: true,

  loadBackground: async () => {
    try {
      const savedBg = await get<string>(DB_BG_KEY);
      if (savedBg) {
        setState({ backgroundUrl: savedBg, isCustom: true, isLoading: false });
        return;
      }
    } catch {
      // Fallback to default
    }
    setState({ backgroundUrl: DEFAULT_BG, isCustom: false, isLoading: false });
  },

  setBackground: async (url: string, isCustomUpload = false) => {
    setState({ backgroundUrl: url, isCustom: isCustomUpload });
    try {
      await set(DB_BG_KEY, url);
    } catch (error) {
      console.error("Failed to save background to IndexedDB", error);
    }
  },

  resetBackground: async () => {
    setState({ backgroundUrl: DEFAULT_BG, isCustom: false });
    try {
      await del(DB_BG_KEY);
    } catch (error) {
      console.error("Failed to clear background from IndexedDB", error);
    }
  },
}));
