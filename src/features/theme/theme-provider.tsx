import { useEffect } from 'react'

import { syncThemeFromStorage, useThemeStore } from './theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    syncThemeFromStorage()
  }, [])

  useEffect(() => {
    if (theme === 'system') return
    const effective = theme === 'dark' ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', effective === 'dark')
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (useThemeStore.getState().theme !== 'system') return
      const next = mq.matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', next === 'dark')
      useThemeStore.setState({ effectiveTheme: next })
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return <>{children}</>
}
