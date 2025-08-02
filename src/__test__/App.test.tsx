import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock ThemeProvider
vi.mock('./providers/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

// Mock RouterContent
vi.mock('./router', () => ({
  RouterContent: () => <div data-testid="router-content">Router Content</div>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('router-content')).toBeInTheDocument();
  });

  it('has correct structure', () => {
    const { container } = render(<App />);
    
    expect(container.firstChild).toBeInTheDocument();
  });
}); 