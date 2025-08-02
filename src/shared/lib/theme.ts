export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as Theme) || null;
};

export const setStoredTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const getInitialTheme = (): Theme => {
  return getStoredTheme() || getSystemTheme();
};
