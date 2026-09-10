// src/components/intro/__tests__/SiteIntro.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { IntroProvider } from '@components/intro/IntroProvider';
import { SiteIntro } from '@components/intro/SiteIntro';

// motion 타임라인은 유닛 테스트에서 no-op으로 대체(레이아웃 미측정 jsdom 안정화).
const { animateMock } = vi.hoisted(() => ({ animateMock: vi.fn() }));
vi.mock('motion/react', () => ({
  useAnimate: () => [{ current: null }, animateMock],
}));

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe('SiteIntro', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-intro');
    vi.unstubAllGlobals();
    animateMock.mockReset().mockResolvedValue(undefined);
  });

  it('animation 오류가 나면 overlay를 제거하고 콘텐츠를 공개한다', async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    animateMock.mockRejectedValueOnce(new Error('animation failed'));
    const { container } = render(
      <IntroProvider>
        <SiteIntro />
      </IntroProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(container.querySelector('[data-intro-overlay]')).toBeNull();
    expect(document.documentElement.dataset.intro).toBe('shown');
    vi.useRealTimers();
  });

  it('pending일 때 워드마크(빈 글자+잉크 채움)를 렌더하고 오버레이를 aria-hidden 처리한다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    const { container } = render(
      <IntroProvider>
        <SiteIntro />
      </IntroProvider>,
    );
    // 현재 헤더와 같은 text를 base + fill 두 겹으로 렌더한다.
    expect(screen.getAllByText('raven').length).toBeGreaterThanOrEqual(1);
    const overlay = container.querySelector('[data-intro-overlay]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-intro-wordmark]')).not.toBeNull();
    expect(container.querySelector('[data-intro-fill]')).not.toBeNull();
  });
});
