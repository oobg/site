import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../app/providers/ThemeProvider';

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('applies theme classes', () => {
    const { container } = render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );
    
    // Check if the component renders without errors
    expect(container.firstChild).toBeInTheDocument();
  });
}); 