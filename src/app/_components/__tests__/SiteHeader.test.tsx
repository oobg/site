import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { SiteHeader } from '@/app/_components/SiteHeader';

const push = vi.fn();
const pathname = vi.hoisted(() => ({ current: '/' }));
const originalPlatform = navigator.platform;
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname.current,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  pathname.current = '/';
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
  it('wordmark, 글·소개 링크, 검색 trigger를 렌더하고 프로젝트는 숨긴다', () => {
    renderHeader();
    const wordmark = screen.getByRole('link', { name: 'raven' });
    expect(wordmark).toHaveAttribute('href', '/');
    expect(wordmark).toHaveAttribute('data-site-wordmark');

    const nav = screen.getByRole('navigation', { name: '주요 내비게이션' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['글', '소개']);
    expect(within(nav).getByRole('link', { name: '글' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: '소개' })).toHaveAttribute('href', '/about');

    expect(screen.getByRole('button', { name: /검색/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '프로젝트' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /projects/i })).not.toBeInTheDocument();
  });

  it('센티넬이 뷰포트를 벗어나면 data-stuck을 달고, 돌아오면 뗀다', () => {
    // 다른 컴포넌트도 IO를 쓰므로, 헤더 센티넬을 관찰하는 인스턴스의 콜백만 집는다.
    const observers: { target?: Element; callback: IntersectionObserverCallback }[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (this: unknown, callback: IntersectionObserverCallback) {
        const record: (typeof observers)[number] = { callback };
        observers.push(record);
        return {
          observe: (target: Element) => {
            record.target = target;
          },
          disconnect,
          unobserve: vi.fn(),
          takeRecords: () => [],
        };
      }),
    );
    const { container, unmount } = renderHeader();
    const header = container.querySelector('header')!;
    const sentinel = header.previousElementSibling!;
    expect(sentinel).toHaveAttribute('aria-hidden', 'true');
    const observer = observers.find((o) => o.target === sentinel);
    expect(observer).toBeDefined();
    const report = (isIntersecting: boolean) =>
      act(() =>
        observer!.callback(
          [{ isIntersecting } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
    expect(header).not.toHaveAttribute('data-stuck');

    report(false);
    expect(header).toHaveAttribute('data-stuck');

    report(true);
    expect(header).not.toHaveAttribute('data-stuck');

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('내비게이션은 검색 trigger보다 앞에 온다', () => {
    renderHeader();
    const nav = screen.getByRole('navigation', { name: '주요 내비게이션' });
    const trigger = screen.getByRole('button', { name: /검색/ });
    expect(nav.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each([
    ['/', '글'],
    ['/blog', '글'],
    ['/blog/dev', '글'],
    ['/blog/dev/some-post', '글'],
    ['/about', '소개'],
  ])('%s에서는 %s만 aria-current="page"다', (path, currentLabel) => {
    pathname.current = path;
    renderHeader();
    const nav = screen.getByRole('navigation', { name: '주요 내비게이션' });
    for (const link of within(nav).getAllByRole('link')) {
      if (link.textContent === currentLabel) expect(link).toHaveAttribute('aria-current', 'page');
      else expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it.each(['/projects', '/projects/raven-api', '/admin', '/blogger'])(
    '%s에서는 어느 링크도 현재 위치로 표시하지 않는다',
    (path) => {
      pathname.current = path;
      renderHeader();
      const nav = screen.getByRole('navigation', { name: '주요 내비게이션' });
      for (const link of within(nav).getAllByRole('link')) {
        expect(link).not.toHaveAttribute('aria-current');
      }
    },
  );

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

  it('listbox 결과는 비포커스 option이고 빈 검색 결과를 announce한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
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
      ),
    );
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: /검색/ }));
    const input = await screen.findByRole('combobox');
    const options = await screen.findAllByRole('option');

    expect(options).toHaveLength(2);
    expect(screen.queryByText('프로젝트')).not.toBeInTheDocument();
    options.forEach((option) => expect(option).toHaveAttribute('tabindex', '-1'));
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

    fireEvent.change(input, { target: { value: '없는검색어' } });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('검색 결과가 없습니다.'),
    );
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });
});
