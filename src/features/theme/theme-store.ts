import { create } from 'zustand'

const STORAGE_KEY = 'raven-theme'

export type ThemeValue = 'system' | 'dark' | 'light'

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getStoredTheme(): ThemeValue | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'dark' || v === 'light' || v === 'system') return v
  return null
}

function resolveEffectiveTheme(choice: ThemeValue): 'dark' | 'light' {
  if (choice === 'system') return getSystemTheme()
  return choice
}

function applyTheme(effective: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', effective === 'dark')
}

export interface ThemeStore {
  theme: ThemeValue
  setTheme: (value: ThemeValue) => void
  effectiveTheme: 'dark' | 'light'
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: getStoredTheme() ?? 'system',
  effectiveTheme: resolveEffectiveTheme(getStoredTheme() ?? 'system'),

  setTheme: (value: ThemeValue) => {
    localStorage.setItem(STORAGE_KEY, value)
    const effective = resolveEffectiveTheme(value)
    applyTheme(effective)
    set({ theme: value, effectiveTheme: effective })
  },
}))

export function syncThemeFromStorage() {
  const stored = getStoredTheme() ?? 'system'
  const effective = resolveEffectiveTheme(stored)
  applyTheme(effective)
  useThemeStore.setState({ theme: stored, effectiveTheme: effective })
}
