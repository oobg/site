import { type Theme } from "@src/shared/lib/theme";

export interface ThemeState {
  theme: Theme;
  isSystem: boolean;
}

export interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSystemTheme: (isSystem: boolean) => void;
}

export type ThemeStore = ThemeState & ThemeActions;
