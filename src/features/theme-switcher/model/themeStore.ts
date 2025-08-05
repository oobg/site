import { create } from "zustand";
import { persist } from "zustand/middleware";

import { type Theme, THEME_STORAGE_KEY, getInitialTheme, applyTheme } from "@src/shared/lib/theme";

import { type ThemeStore } from "./types";

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      isSystem: false,

      setTheme: (theme: Theme) => {
        set({ theme, isSystem: false });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme: Theme = theme === "light" ? "dark" : "light";
        set({ theme: newTheme, isSystem: false });
        applyTheme(newTheme);
      },

      setSystemTheme: (isSystem: boolean) => {
        set({ isSystem });
        if (isSystem) {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
          set({ theme: systemTheme });
          applyTheme(systemTheme);
        }
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ theme: state.theme, isSystem: state.isSystem }),
    },
  ),
);
