import { Monitor,Moon, Sun } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import { type ThemeValue,useThemeStore } from './theme-store'

const options: { value: ThemeValue; icon: typeof Sun }[] = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
]

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div
      className="flex rounded-md border border-border p-0.5"
      role="group"
      aria-label="테마 선택"
    >
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            'rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            theme === value && 'bg-muted text-foreground'
          )}
          aria-pressed={theme === value}
          aria-label={
            value === 'system'
              ? '시스템 테마'
              : value === 'dark'
                ? '다크'
                : '라이트'
          }
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
