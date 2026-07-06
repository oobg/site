// src/components/intro/__tests__/IntroProvider.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { IntroProvider, useIntro } from '@components/intro/IntroProvider';

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

function Probe() {
  const { playing, revealed, finish } = useIntro();
  return (
    <div>
      <span data-testid="playing">{String(playing)}</span>
      <span data-testid="revealed">{String(revealed)}</span>
      <button onClick={finish}>finish</button>
    </div>
  );
}

describe('IntroProvider / useIntro', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-intro');
    vi.unstubAllGlobals();
  });

  it('pending + 모션 정상: playing=true, revealed=false로 시작한다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    render(
      <IntroProvider>
        <Probe />
      </IntroProvider>,
    );
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
    expect(screen.getByTestId('revealed')).toHaveTextContent('false');
  });

  it('finish() 호출 시 playing=false, revealed=true가 된다', () => {
    document.documentElement.dataset.intro = 'pending';
    mockReducedMotion(false);
    render(
      <IntroProvider>
        <Probe />
      </IntroProvider>,
    );
    act(() => {
      screen.getByRole('button', { name: 'finish' }).click();
    });
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    expect(screen.getByTestId('revealed')).toHaveTextContent('true');
  });

  it('shown 상태면 재생하지 않고 즉시 공개한다', () => {
    document.documentElement.dataset.intro = 'shown';
    mockReducedMotion(false);
    render(
      <IntroProvider>
        <Probe />
      </IntroProvider>,
    );
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    expect(screen.getByTestId('revealed')).toHaveTextContent('true');
  });

  it('provider 없이 useIntro는 revealed=true 기본값을 준다', () => {
    render(<Probe />);
    expect(screen.getByTestId('revealed')).toHaveTextContent('true');
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
  });
});
