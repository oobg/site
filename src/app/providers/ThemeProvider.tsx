import { useEffect } from 'react';
import { useThemeStore } from '@src/features/theme-switcher';
import { applyTheme, getInitialTheme } from '@src/shared/lib/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useThemeStore();

  // 초기 테마 적용
  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
  }, []);

  // 테마 변경 시 적용
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const { isSystem } = useThemeStore.getState();
      if (isSystem) {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        useThemeStore.getState().setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
