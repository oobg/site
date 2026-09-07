import { describe, expect, it } from 'vitest';

import { normalizeSlug } from '@/features/admin/services/slug';

describe('normalizeSlug', () => {
  it('keeps a Korean title and replaces spaces with hyphens', () => {
    expect(normalizeSlug('나의 첫 글')).toBe('나의-첫-글');
  });

  it('normalizes decomposed Korean characters to NFC', () => {
    expect(normalizeSlug('나의 첫 글')).toBe('나의-첫-글');
  });

  it('removes URL-unsafe punctuation and collapses hyphens', () => {
    expect(normalizeSlug(' Hello, 한글! -- URL ')).toBe('hello-한글-url');
  });
});
