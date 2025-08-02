import { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // 다크모드 강제 적용
  useEffect(() => {
    // HTML에 dark 클래스 추가
    document.documentElement.classList.add('dark');
    
    // body에 dark 클래스 추가
    document.body.classList.add('dark');
    
    // CSS 변수 적용
    document.documentElement.style.setProperty('--color-bg-primary', '#0a0a0a');
    document.documentElement.style.setProperty('--color-bg-secondary', '#111111');
    document.documentElement.style.setProperty('--color-bg-tertiary', '#1a1a1a');
    document.documentElement.style.setProperty('--color-bg-card', '#1e1e1e');
    document.documentElement.style.setProperty('--color-text-primary', '#ffffff');
    document.documentElement.style.setProperty('--color-text-secondary', '#e2e8f0');
    document.documentElement.style.setProperty('--color-text-muted', '#a0aec0');
    document.documentElement.style.setProperty('--color-text-accent', '#805ad5');
    document.documentElement.style.setProperty('--color-border', '#2d3748');
    document.documentElement.style.setProperty('--color-border-glow', '#805ad5');
    document.documentElement.style.setProperty('--color-accent', '#805ad5');
    document.documentElement.style.setProperty('--color-accent-hover', '#9f7aea');
    document.documentElement.style.setProperty('--color-glow', '#805ad5');
    document.documentElement.style.setProperty('--color-glow-secondary', '#9f7aea');
    document.documentElement.style.setProperty('--color-neon', '#00ffff');
    document.documentElement.style.setProperty('--color-neon-purple', '#8b5cf6');
  }, []);

  return <>{children}</>;
}
