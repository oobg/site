import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from '@/app/_container/CommandPalette';

const mocks = vi.hoisted(() => ({ push: vi.fn(), track: vi.fn() }));
vi.mock('@lib/analytics/events', () => ({ trackPublicEvent: mocks.track }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({
    data: {
      categories: [],
      archive: {
        items: [{ slug: 'my-post', title: '개발 글', category: { slug: 'dev', name: '개발' } }],
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

describe('CommandPalette post navigation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups page shortcuts separately while preserving the flat keyboard option order', async () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByRole('button', { name: '검색 열기' }));
    expect(await screen.findByRole('group', { name: '바로가기' })).toBeVisible();
    expect(screen.getByRole('group', { name: '글' })).toBeVisible();
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mocks.push).toHaveBeenCalledWith('/blog/dev/my-post');
    expect(mocks.track.mock.calls).toEqual([
      ['search_open', 'header'],
      ['search_result_open', 'palette'],
    ]);
  });

  it('navigates a search result to its canonical category URL', async () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByRole('button', { name: '검색 열기' }));
    fireEvent.click(await screen.findByRole('option', { name: /개발 글/ }));
    expect(mocks.push).toHaveBeenCalledWith('/blog/dev/my-post');
  });

  it('reopens with the shortcut after closing during Korean composition', async () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByRole('button', { name: '검색 열기' }));
    fireEvent.compositionStart(await screen.findByRole('combobox'));
    fireEvent.click(screen.getByRole('button', { name: '검색 닫기' }));
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(await screen.findByRole('combobox')).toBeVisible();
  });

  it('clears composition state when a result is selected with the mouse', async () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByRole('button', { name: '검색 열기' }));
    fireEvent.compositionStart(await screen.findByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /개발 글/ }));
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(await screen.findByRole('combobox')).toBeVisible();
    expect(mocks.push).toHaveBeenCalledWith('/blog/dev/my-post');
  });
});
