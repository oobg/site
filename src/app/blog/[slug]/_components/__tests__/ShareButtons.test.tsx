import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareButtons } from '@/app/blog/[slug]/_components/ShareButtons';

describe('ShareButtons', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    window.history.replaceState({}, '', '/blog/dev/my-post');
  });

  afterEach(() => vi.useRealTimers());

  it('현재 주소를 복사하고 2초 뒤 기본 상태로 돌아온다', async () => {
    render(<ShareButtons title="테스트 글" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '링크 복사' })));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/blog/dev/my-post');
    expect(screen.getByRole('button', { name: '링크가 복사됨' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeInTheDocument();
  });

  it('복사 실패 시 성공 상태를 표시하지 않는다', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    render(<ShareButtons title="테스트 글" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '링크 복사' })));
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeInTheDocument();
  });

  it('지원 환경에서만 네이티브 공유를 노출하고 제목과 주소를 전달한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<ShareButtons title="테스트 글" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '공유하기' })));
    expect(share).toHaveBeenCalledWith({
      title: '테스트 글',
      url: 'http://localhost:3000/blog/dev/my-post',
    });
  });

  it('연속 복사하면 가장 최근 클릭부터 2초 동안 상태를 유지한다', async () => {
    render(<ShareButtons title="테스트 글" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '링크 복사' })));
    act(() => vi.advanceTimersByTime(1000));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '링크가 복사됨' })));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: '링크가 복사됨' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeInTheDocument();
  });

  it('unmount할 때 상태 복구 타이머를 정리한다', async () => {
    const clearTimeout = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<ShareButtons title="테스트 글" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '링크 복사' })));
    unmount();
    expect(clearTimeout).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
