// src/components/intro/__tests__/SiteIntro.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntroProvider } from '@components/intro/IntroProvider';
import { SiteIntro } from '@components/intro/SiteIntro';

// motion 타임라인은 유닛 테스트에서 no-op으로 대체(레이아웃 미측정 jsdom 안정화).
vi.mock('motion/react', () => ({
  useAnimate: () => [{ current: null }, vi.fn().mockResolvedValue(undefined)],
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
  });

  it('pending일 때 워드마크(빈 글자+잉크 채움)를 렌더하고 오버레이를 aria-hidden 처리한다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    const { container } = render(
      <IntroProvider>
        <SiteIntro />
      </IntroProvider>,
    );
    // base + fill 두 겹으로 'raven.kr'이 렌더된다.
    expect(screen.getAllByText('raven.kr').length).toBeGreaterThanOrEqual(1);
    const overlay = container.querySelector('[data-intro-overlay]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-intro-wordmark]')).not.toBeNull();
    expect(container.querySelector('[data-intro-fill]')).not.toBeNull();
  });
});
