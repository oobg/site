import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeCopy } from '@components/content/CodeCopy';

function CodeFixture() {
  return (
    <>
      <CodeCopy />
      <figure data-code>
        <button type="button" data-code-copy>
          <span data-code-copy-status>코드 복사</span>
        </button>
        <pre>
          <code>{'const value = 1;'}</code>
        </pre>
      </figure>
    </>
  );
}

describe('CodeCopy', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  afterEach(() => vi.useRealTimers());

  it('위임된 클릭으로 코드 원문을 복사하고 상태를 되돌린다', async () => {
    render(<CodeFixture />);
    const button = screen.getByRole('button');
    await act(async () => fireEvent.click(button));
    expect(writeText).toHaveBeenCalledWith('const value = 1;');
    expect(button).toHaveAttribute('data-copied');
    expect(screen.getByText('복사됨')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1600));
    expect(button).not.toHaveAttribute('data-copied');
    expect(screen.getByText('코드 복사')).toBeInTheDocument();
  });

  it('클립보드 권한 실패를 성공 상태로 표시하지 않는다', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    render(<CodeFixture />);
    const button = screen.getByRole('button');
    await act(async () => fireEvent.click(button));
    expect(button).not.toHaveAttribute('data-copied');
    expect(screen.getByText('코드 복사')).toBeInTheDocument();
  });

  it('코드 블록 밖의 클릭은 무시한다', () => {
    render(
      <>
        <CodeCopy />
        <button type="button">일반 버튼</button>
      </>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('클립보드 응답 전에 unmount되면 분리된 버튼 상태를 바꾸지 않는다', async () => {
    let resolveCopy: (() => void) | undefined;
    writeText.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCopy = resolve;
      }),
    );
    const { unmount } = render(<CodeFixture />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    unmount();
    await act(async () => resolveCopy?.());
    expect(button).not.toHaveAttribute('data-copied');
    expect(vi.getTimerCount()).toBe(0);
  });
});
