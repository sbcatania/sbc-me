"use client";

import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { UserPrefs, UserPrefsSchema, DEFAULT_USER_PREFS } from "@/lib/model/schema";

const PREFS_KEY = "prefs";

interface PrefsState {
  initialized: boolean;
  prefs: UserPrefs;

  initialize: () => Promise<void>;
  updatePrefs: (updates: Partial<UserPrefs>) => void;
  setLabelMode: (mode: "hover" | "always") => void;
  setFontFamily: (font: "inter" | "ibm-plex-mono" | "system") => void;
  setGridEnabled: (enabled: boolean) => void;
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  initialized: false,
  prefs: DEFAULT_USER_PREFS,

  initialize: async () => {
    try {
      const data = await idbGet<UserPrefs>(PREFS_KEY);
      if (data) {
        const validated = UserPrefsSchema.parse(data);
        set({ prefs: validated, initialized: true });
      } else {
        set({ prefs: DEFAULT_USER_PREFS, initialized: true });
        await idbSet(PREFS_KEY, DEFAULT_USER_PREFS);
      }
    } catch (error) {
      console.error("Failed to initialize prefs:", error);
      set({ prefs: DEFAULT_USER_PREFS, initialized: true });
    }
  },

  updatePrefs: (updates: Partial<UserPrefs>) => {
    const newPrefs = { ...get().prefs, ...updates };
    set({ prefs: newPrefs });
    idbSet(PREFS_KEY, newPrefs);
  },

  setLabelMode: (mode: "hover" | "always") => {
    const { prefs } = get();
    const newPrefs = { ...prefs, labelModeDefault: mode };
    set({ prefs: newPrefs });
    idbSet(PREFS_KEY, newPrefs);
  },

  setFontFamily: (font: "inter" | "ibm-plex-mono" | "system") => {
    const { prefs } = get();
    const newPrefs = {
      ...prefs,
      theme: { ...prefs.theme, fontFamily: font },
    };
    set({ prefs: newPrefs });
    idbSet(PREFS_KEY, newPrefs);
  },

  setGridEnabled: (enabled: boolean) => {
    const { prefs } = get();
    const newPrefs = {
      ...prefs,
      grid: { ...prefs.grid, enabled },
    };
    set({ prefs: newPrefs });
    idbSet(PREFS_KEY, newPrefs);
  },
}));
