import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommentsSection } from './CommentsSection';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('CommentsSection identity picker', () => {
  it('keeps the nickname matched to the selected avatar while revealing it gradually', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, nextCursor: null }),
      }),
    );

    const { container } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    const input = screen.getByLabelText('닉네임') as HTMLInputElement;
    const button = screen.getByRole('button', { name: '랜덤 변경' });
    expect(input.value).toBe('고요한 사과');

    fireEvent.click(button);
    expect(input.value).toBe('');
    expect(container.querySelector('img[data-randomized="true"]')).not.toBeNull();

    act(() => vi.advanceTimersByTime(40 * '고요한 사과'.length));

    expect(input.value).toBe('고요한 사과');
    expect(container.querySelector('img[src$="/clay-01.webp"]')).not.toBeNull();
  });
});
