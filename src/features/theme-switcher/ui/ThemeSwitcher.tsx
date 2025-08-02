import { useEffect } from 'react';
import { useThemeStore } from '../model/themeStore';
import { applyTheme } from '@src/shared/lib/theme';

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    console.log('ThemeSwitcher: theme changed to', theme);
    applyTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    console.log('ThemeSwitcher: toggle clicked, current theme:', theme);
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className={`text-2xl p-2 rounded-lg hover:bg-background-secondary transition-colors ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
