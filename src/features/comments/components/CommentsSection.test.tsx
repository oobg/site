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
    for (let step = 0; step < 4; step += 1) await Promise.resolve();
  });
}

function emptyPage() {
  return {
    ok: true,
    json: async () => ({ items: [], total: 0, nextCursor: null }),
  };
}

/* 모션 축소 여부만 바꾸고 나머지 응답 모양은 vitest.setup.ts의 기본과 맞춘다. */
function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        media: query,
        matches: reduced && query.includes('prefers-reduced-motion'),
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

describe('CommentsSection identity picker', () => {
  it('keeps the nickname matched to the selected avatar while revealing it gradually', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(emptyPage()));

    const { container } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    const input = screen.getByLabelText('닉네임') as HTMLInputElement;
    const button = screen.getByRole('button', { name: '랜덤 변경' });
    expect(input.value).toBe('고요한 사과');

    fireEvent.change(screen.getByLabelText('댓글 내용'), { target: { value: '반가워요' } });
    fireEvent.click(button);
    expect(input.value).toBe('');
    expect(container.querySelector('img[data-randomized="true"]')).not.toBeNull();

    /* 전환 연출은 보이는 값만 늦춘다. 제출용 값은 이미 완성돼 있으므로
       등록 버튼이 이 사이에 잠기면 안 된다. */
    expect(screen.getByRole('button', { name: '댓글 등록' })).toBeEnabled();

    act(() => vi.advanceTimersByTime(40 * '고요한 사과'.length));

    expect(input.value).toBe('고요한 사과');
    expect(container.querySelector('img[src$="/clay-01.webp"]')).not.toBeNull();
    expect(screen.getByText('닉네임과 아이콘을 새로 골랐어요. 고요한 사과')).toBeInTheDocument();
  });

  it('reveals the whole nickname at once when the reader asks for reduced motion', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    stubReducedMotion(true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(emptyPage()));

    render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    const input = screen.getByLabelText('닉네임') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '랜덤 변경' }));

    expect(input.value).toBe('고요한 사과');
    expect(screen.getByText('닉네임과 아이콘을 새로 골랐어요. 고요한 사과')).toBeInTheDocument();
  });

  it('stops the reveal as soon as the reader types the nickname directly', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(emptyPage()));

    render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    const input = screen.getByLabelText('닉네임') as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: '랜덤 변경' }));
    act(() => vi.advanceTimersByTime(40));
    expect(input.value).toBe('고');

    fireEvent.change(input, { target: { value: '직접 쓴 이름' } });
    act(() => vi.advanceTimersByTime(40 * 20));

    expect(input.value).toBe('직접 쓴 이름');
    expect(screen.queryByText(/새로 골랐어요/)).toBeNull();
  });

  it('sends the nickname and avatar the reader can see', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            comment: {
              id: 'c1',
              nickname: '고요한 사과',
              avatar_id: 'clay-01',
              body: '반가워요',
              created_at: '2026-09-21T00:00:00.000Z',
            },
          }),
        });
      }
      return Promise.resolve(emptyPage());
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    fireEvent.change(screen.getByLabelText('댓글 내용'), { target: { value: '반가워요' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await flushMicrotasks();

    const posted = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(posted).toBeDefined();
    expect(JSON.parse((posted as [string, RequestInit])[1].body as string)).toEqual({
      nickname: '고요한 사과',
      avatar_id: 'clay-01',
      body: '반가워요',
    });
    expect(container.querySelector('img[src$="/clay-01.webp"]')).not.toBeNull();
  });
});

describe('CommentsSection load failure', () => {
  it('surfaces the failure in the status region and recovers through the retry action', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'c1',
              nickname: '고요한 사과',
              avatar_id: 'clay-01',
              body: '다시 불러온 댓글',
              created_at: '2026-09-21T00:00:00.000Z',
            },
          ],
          total: 1,
          nextCursor: null,
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<CommentsSection slug="post" />);
    await flushMicrotasks();

    const status = screen.getByText('댓글을 불러오지 못했어요. 다시 시도해 주세요.');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    await flushMicrotasks();

    expect(screen.getByText('다시 불러온 댓글')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 불러오기' })).toBeNull();
    expect(screen.queryByText('댓글을 불러오지 못했어요. 다시 시도해 주세요.')).toBeNull();
  });
});
