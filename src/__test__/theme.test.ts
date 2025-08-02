import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSystemTheme, getStoredTheme, setStoredTheme, applyTheme } from './theme';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock matchMedia
const mockMatchMedia = vi.fn();

describe('theme utilities', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });

    // Mock document methods
    const mockAddClass = vi.fn();
    const mockRemoveClass = vi.fn();
    const mockSetProperty = vi.fn();

    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: {
          add: mockAddClass,
          remove: mockRemoveClass,
        },
        style: {
          setProperty: mockSetProperty,
        },
      },
      writable: true,
    });

    Object.defineProperty(document, 'body', {
      value: {
        classList: {
          add: mockAddClass,
          remove: mockRemoveClass,
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemTheme', () => {
    it('returns "dark" when system prefers dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
      });

      const theme = getSystemTheme();
      expect(theme).toBe('dark');
    });

    it('returns "light" when system prefers light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
      });

      const theme = getSystemTheme();
      expect(theme).toBe('light');
    });
  });

  describe('getStoredTheme', () => {
    it('returns stored theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      const theme = getStoredTheme();
      expect(theme).toBe('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('returns null when no theme is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const theme = getStoredTheme();
      expect(theme).toBeNull();
    });
  });

  describe('setStoredTheme', () => {
    it('stores theme in localStorage', () => {
      setStoredTheme('dark');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('stores light theme in localStorage', () => {
      setStoredTheme('light');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('applyTheme', () => {
    it('applies dark theme correctly', () => {
      const mockAddClass = vi.fn();
      const mockSetProperty = vi.fn();

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: mockAddClass,
            remove: vi.fn(),
          },
          style: {
            setProperty: mockSetProperty,
          },
        },
        writable: true,
      });

      Object.defineProperty(document, 'body', {
        value: {
          classList: {
            add: mockAddClass,
            remove: vi.fn(),
          },
        },
        writable: true,
      });

      applyTheme('dark');

      expect(mockAddClass).toHaveBeenCalledWith('dark');
    });

    it('applies light theme correctly', () => {
      const mockAddClass = vi.fn();
      const mockRemoveClass = vi.fn();

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: mockAddClass,
            remove: mockRemoveClass,
          },
          style: {
            setProperty: vi.fn(),
          },
        },
        writable: true,
      });

      Object.defineProperty(document, 'body', {
        value: {
          classList: {
            add: mockAddClass,
            remove: mockRemoveClass,
          },
        },
        writable: true,
      });

      applyTheme('light');

      expect(mockRemoveClass).toHaveBeenCalledWith('dark');
    });
  });
}); 