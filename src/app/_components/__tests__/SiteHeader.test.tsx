import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { SiteHeader } from '@/app/_components/SiteHeader';

const push = vi.fn();
const originalPlatform = navigator.platform;
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  Object.defineProperty(navigator, 'platform', {
    configurable: true,
    value: originalPlatform,
  });
});

function renderHeader() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SiteHeader />
    </QueryClientProvider>,
  );
}

describe('SiteHeader', () => {
  it('로고와 command palette trigger만 렌더한다', () => {
    renderHeader();
    const wordmark = screen.getByRole('link', { name: 'raven' });
    expect(wordmark).toHaveAttribute('href', '/');
    expect(wordmark).toHaveAttribute('data-site-wordmark');
    expect(screen.getByRole('button', { name: /검색/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '소개' })).not.toBeInTheDocument();
  });

  it('SSR은 안정적인 Ctrl 표기를 쓰고 macOS에서는 mount 뒤 Command 표기로 바꾼다', async () => {
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'MacIntel' });

    expect(
      renderToString(
        <QueryClientProvider client={new QueryClient()}>
          <SiteHeader />
        </QueryClientProvider>,
      ),
    ).toContain('Ctrl K');

    renderHeader();
    await waitFor(() => expect(screen.getByText('⌘ K')).toBeInTheDocument());
  });

  it('Windows와 Linux 계열에서는 Ctrl 단축키를 표시한다', () => {
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'Win32' });
    renderHeader();
    expect(screen.getByText('Ctrl K')).toBeInTheDocument();
  });

  it('trigger와 단축키로 열고 Escape 뒤 호출 요소로 focus를 복원한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            featured: [],
            categories: [],
            sections: [],
            archive: { items: [], page: 1, pageSize: 6, totalItems: 0, totalPages: 0 },
          }),
          { status: 200 },
        ),
      ),
    );
    renderHeader();
    const trigger = screen.getByRole('button', { name: /검색/ });
    fireEvent.click(trigger);
    const firstInput = await screen.findByRole('combobox');
    await waitFor(() => expect(firstInput).toHaveFocus());
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveFocus());

    const logo = screen.getByRole('link', { name: 'raven' });
    logo.focus();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const shortcutInput = await screen.findByRole('combobox');
    await waitFor(() => expect(shortcutInput).toHaveFocus());
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(logo).toHaveFocus());
  });

  it('방향키와 Enter로 결과를 선택하고 IME Enter는 무시한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            featured: [],
            categories: [],
            sections: [],
            archive: { items: [], page: 1, pageSize: 6, totalItems: 0, totalPages: 0 },
          }),
          { status: 200 },
        ),
      ),
    );
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));
    const input = await screen.findByRole('combobox');
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(push).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(push).toHaveBeenCalledWith('/about');
  });
});
