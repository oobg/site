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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function commentResponse(body: string) {
  return new Response(
    JSON.stringify({
      comment: {
        id: body,
        parent_id: null,
        is_author: false,
        nickname: '독자',
        avatar_id: 'clay-01',
        body,
        created_at: '2026-09-21T00:00:00.000Z',
      },
    }),
    { status: 201 },
  );
}

function pageResponse(body: string) {
  return new Response(
    JSON.stringify({
      items: [
        {
          id: body,
          parent_id: null,
          is_author: false,
          nickname: '독자',
          avatar_id: 'clay-01',
          body,
          created_at: '2026-09-21T00:00:00.000Z',
        },
      ],
      total: 1,
      nextCursor: null,
    }),
  );
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
  it('surfaces one recovery message and recovers through the retry action', async () => {
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

    expect(screen.getByText('댓글은 잠시 쉬고 있어요.')).toBeInTheDocument();
    expect(screen.queryByText('댓글을 불러오지 못했어요. 다시 시도해 주세요.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    await flushMicrotasks();

    expect(screen.getByText('다시 불러온 댓글')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 불러오기' })).toBeNull();
    expect(screen.queryByText('댓글은 잠시 쉬고 있어요.')).toBeNull();
  });
});

describe('CommentsSection pending requests', () => {
  it('announces appended comments without moving focus or replacing existing comments', async () => {
    const first = await pageResponse('먼저 읽은 댓글').json();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...first, total: 2, nextCursor: 'next' })),
      )
      .mockResolvedValueOnce(pageResponse('추가 댓글'));
    vi.stubGlobal('fetch', fetchMock);
    render(<CommentsSection slug="post" />);
    await flushMicrotasks();
    const more = screen.getByRole('button', { name: '댓글 더 보기' });
    fireEvent.click(more);
    await flushMicrotasks();
    expect(screen.getByText('먼저 읽은 댓글')).toBeVisible();
    expect(screen.getByText('추가 댓글')).toBeVisible();
    expect(screen.getByText('댓글 1개를 더 불러왔어요.')).toHaveAttribute('role', 'status');
    expect(fetchMock.mock.calls[1][0]).toContain('cursor=next');
  });
  it('keeps a new draft typed while the previous comment is being submitted', async () => {
    const pending = deferred<Response>();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation((_url: string, init?: RequestInit) =>
          init?.method === 'POST' ? pending.promise : Promise.resolve(emptyPage()),
        ),
    );
    const { container } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();
    const textarea = screen.getByLabelText('댓글 내용');
    fireEvent.change(textarea, { target: { value: '첫 번째 댓글' } });
    fireEvent.submit(container.querySelector('form')!);
    fireEvent.change(textarea, { target: { value: '쓰고 있는 다음 댓글' } });

    await act(async () => pending.resolve(commentResponse('첫 번째 댓글')));
    await flushMicrotasks();

    expect(screen.getByText('첫 번째 댓글')).toBeVisible();
    expect(textarea).toHaveValue('쓰고 있는 다음 댓글');
    expect(screen.getByRole('heading', { name: '댓글 1' })).toBeVisible();
  });

  it('ignores repeated submissions while the first request is pending', async () => {
    const pending = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockImplementation((_url: string, init?: RequestInit) =>
        init?.method === 'POST' ? pending.promise : Promise.resolve(emptyPage()),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<CommentsSection slug="post" />);
    await flushMicrotasks();
    fireEvent.change(screen.getByLabelText('댓글 내용'), { target: { value: '한 번만 등록' } });
    fireEvent.submit(container.querySelector('form')!);
    fireEvent.submit(container.querySelector('form')!);

    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    await act(async () => pending.resolve(commentResponse('한 번만 등록')));
    await flushMicrotasks();
    expect(screen.getByLabelText('댓글 내용')).toHaveValue('');
    expect(screen.getByRole('heading', { name: '댓글 1' })).toBeVisible();
  });

  it('does not let a late list response overwrite the next article', async () => {
    const previous = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string) =>
        url.includes('/old/') ? previous.promise : Promise.resolve(pageResponse('새 글의 댓글')),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { rerender } = render(<CommentsSection slug="old" />);
    await flushMicrotasks();
    const previousSignal = (fetchMock.mock.calls[0][1] as RequestInit | undefined)?.signal;

    rerender(<CommentsSection slug="new" />);
    await flushMicrotasks();
    await act(async () => previous.resolve(pageResponse('이전 글의 늦은 댓글')));
    await flushMicrotasks();

    expect(previousSignal?.aborted).toBe(true);
    expect(screen.getByText('새 글의 댓글')).toBeVisible();
    expect(screen.queryByText('이전 글의 늦은 댓글')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '댓글 1' })).toBeVisible();
  });

  it('isolates a late submit response and drafts when the article changes', async () => {
    const previous = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockImplementation((_url: string, init?: RequestInit) =>
        init?.method === 'POST' ? previous.promise : Promise.resolve(emptyPage()),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { container, rerender } = render(<CommentsSection slug="old" />);
    await flushMicrotasks();
    fireEvent.change(screen.getByLabelText('댓글 내용'), { target: { value: '이전 글에 등록' } });
    fireEvent.submit(container.querySelector('form')!);
    const previousSignal = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]
      ?.signal;

    rerender(<CommentsSection slug="new" />);
    await flushMicrotasks();
    expect(screen.getByLabelText('댓글 내용')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('댓글 내용'), { target: { value: '새 글의 원고' } });
    await act(async () => previous.resolve(commentResponse('이전 글에 등록')));
    await flushMicrotasks();

    expect(previousSignal?.aborted).toBe(true);
    expect(screen.getByLabelText('댓글 내용')).toHaveValue('새 글의 원고');
    expect(screen.queryByText('이전 글에 등록')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '댓글 0' })).toBeVisible();
    expect(screen.getByRole('button', { name: '댓글 등록' })).toBeEnabled();
  });
});
