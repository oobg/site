import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

// Mock document methods
const mockAddClass = vi.fn();
const mockSetProperty = vi.fn();

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: {
          add: mockAddClass,
        },
        style: {
          setProperty: mockSetProperty,
        },
      },
      writable: true,
    });

    // Mock document.body
    Object.defineProperty(document, 'body', {
      value: {
        classList: {
          add: mockAddClass,
        },
      },
      writable: true,
    });

    // Mock document.createElement and appendChild
    const mockDiv = {
      appendChild: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
    };
    
    Object.defineProperty(document, 'createElement', {
      value: vi.fn(() => mockDiv),
      writable: true,
    });
    
    Object.defineProperty(document, 'getElementById', {
      value: vi.fn(() => mockDiv),
      writable: true,
    });

    // Mock document.body.appendChild
    Object.defineProperty(document.body, 'appendChild', {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('applies dark theme classes and CSS variables', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );
    
    // Check if dark classes are added
    expect(mockAddClass).toHaveBeenCalledWith('dark');
    
    // Check if CSS variables are set
    expect(mockSetProperty).toHaveBeenCalledWith('--color-bg-primary', '#0a0a0a');
    expect(mockSetProperty).toHaveBeenCalledWith('--color-bg-secondary', '#111111');
    expect(mockSetProperty).toHaveBeenCalledWith('--color-text-primary', '#ffffff');
    expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', '#805ad5');
  });

  it('applies all required CSS variables', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );
    
    // Check that all expected CSS variables are set
    const expectedVariables = [
      '--color-bg-primary',
      '--color-bg-secondary', 
      '--color-bg-tertiary',
      '--color-bg-card',
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-muted',
      '--color-text-accent',
      '--color-border',
      '--color-border-glow',
      '--color-accent',
      '--color-accent-hover',
      '--color-glow',
      '--color-glow-secondary',
      '--color-neon',
      '--color-neon-purple'
    ];
    
    expectedVariables.forEach(variable => {
      expect(mockSetProperty).toHaveBeenCalledWith(variable, expect.any(String));
    });
  });
}); 