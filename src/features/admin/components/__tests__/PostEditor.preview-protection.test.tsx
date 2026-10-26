import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostEditor } from '@features/admin/components/PostEditor';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
const post = {
  id: 'p1',
  title: '제목',
  slug: 'title',
  description: '설명',
  body: '기존 원문',
  status: 'draft' as const,
  category_id: 'c1',
};
const categories = [{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }];
const response = (html: string) => new Response(JSON.stringify({ html }));
function deferred() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const tick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
const open = () => fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
const editor = () => screen.getByRole('textbox', { name: '본문 텍스트 편집' });
const source = () => document.querySelector<HTMLTextAreaElement>('#post-body')!;
function setup(body = post.body) {
  const save = vi.fn(async (_previous: unknown, _data: FormData) => ({
    status: 'success' as const,
    message: '저장했습니다.',
  }));
  render(<PostEditor action={save} post={{ ...post, body }} categories={categories} />);
  return save;
}

describe('P1 preview initialization protection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('500 뒤 강제 input을 무시하고 마크다운 전환 및 저장에 원문을 유지한다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: '미리보기 실패' }), { status: 500 }),
    );
    const save = setup();
    open();
    await tick();
    expect(editor()).toHaveAttribute('contenteditable', 'false');
    expect(editor()).toHaveAttribute('aria-readonly', 'true');
    editor().innerHTML = '<p>강제 입력</p>';
    fireEvent.input(editor());
    expect(source()).toHaveValue(post.body);
    fireEvent.click(screen.getByRole('button', { name: '마크다운으로 편집' }));
    expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue(post.body);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '초안 저장' })));
    expect(save.mock.calls[0]?.[1].get('body')).toBe(post.body);
  });

  it('지연 중 입력을 잠그고 첫 성공 HTML 반영 후에만 편집을 허용한다', async () => {
    const request = deferred();
    vi.mocked(fetch).mockReturnValue(request.promise);
    setup();
    open();
    expect(editor()).toHaveAttribute('contenteditable', 'false');
    editor().innerHTML = '무시';
    fireEvent.input(editor());
    await tick();
    expect(source()).toHaveValue(post.body);
    await act(async () => request.resolve(response('<p>기존 원문</p>')));
    expect(editor()).toHaveAttribute('contenteditable', 'true');
    expect(editor()).toHaveTextContent('기존 원문');
  });

  it('탭 이탈과 새 원문 진입 후 늦은 이전 응답을 무시한다', async () => {
    const old = deferred();
    const current = deferred();
    vi.mocked(fetch).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    setup();
    open();
    await tick();
    fireEvent.click(screen.getByRole('tab', { name: '마크다운' }));
    fireEvent.change(source(), { target: { value: '새 원문' } });
    open();
    await tick();
    await act(async () => current.resolve(response('<p>새 원문</p>')));
    const node = editor().firstChild;
    await act(async () => old.resolve(response('<p>오래된 원문</p>')));
    expect(editor().firstChild).toBe(node);
    expect(editor()).toHaveTextContent('새 원문');
    expect(source()).toHaveValue('새 원문');
  });

  it('편집 중 재요청과 한글 조합 중 늦은 응답이 DOM·선택·스크롤·입력을 유지한다', async () => {
    const background = deferred();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response('<p>기존 원문</p>'))
      .mockReturnValueOnce(background.promise);
    setup();
    open();
    await tick();
    const visual = editor();
    const node = visual.firstChild!.firstChild!;
    node.textContent = '기존 원문 수정';
    fireEvent.input(visual);
    await tick();
    expect(fetch).toHaveBeenCalledTimes(2);
    const panel = screen.getByRole('tabpanel', { name: '텍스트 편집' });
    panel.scrollTop = 180;
    const selection = window.getSelection()!;
    selection.setBaseAndExtent(node, 2, node, 2);
    fireEvent.compositionStart(visual);
    node.textContent = '기존 원문 수정ㅎ';
    selection.setBaseAndExtent(node, 3, node, 3);
    fireEvent.input(visual, { isComposing: true });
    await act(async () => background.resolve(response('<p>덮어쓰면 안 되는 응답</p>')));
    expect(visual.firstChild!.firstChild).toBe(node);
    expect(selection.anchorNode).toBe(node);
    expect(selection.anchorOffset).toBe(3);
    expect(panel.scrollTop).toBe(180);
    expect(visual).toHaveAttribute('contenteditable', 'true');
    expect(visual).toHaveAttribute('aria-readonly', 'false');
    node.textContent = '기존 원문 수정한글';
    fireEvent.input(visual);
    fireEvent.compositionEnd(visual);
    expect(source()).toHaveValue('기존 원문 수정한글');
  });

  it('현재 유효한 배경 응답도 편집 중 DOM과 원문을 다시 쓰지 않는다', async () => {
    const background = deferred();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response('<p>기존 원문</p>'))
      .mockReturnValueOnce(background.promise);
    setup();
    open();
    await tick();
    const visual = editor();
    const node = visual.firstChild!.firstChild!;
    node.textContent = '직접 수정한 본문';
    fireEvent.input(visual);
    const panel = screen.getByRole('tabpanel', { name: '텍스트 편집' });
    panel.scrollTop = 180;
    const selection = window.getSelection()!;
    selection.setBaseAndExtent(node, 3, node, 3);
    await tick();
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => background.resolve(response('<p>서버의 다른 DOM</p>')));
    expect(screen.getByRole('status')).toHaveTextContent('미리보기가 최신 내용이에요.');
    expect(visual.firstChild!.firstChild).toBe(node);
    expect(selection.anchorNode).toBe(node);
    expect(selection.anchorOffset).toBe(3);
    expect(panel.scrollTop).toBe(180);
    expect(visual).toHaveAttribute('contenteditable', 'true');
    expect(visual).toHaveAttribute('aria-readonly', 'false');
    expect(source()).toHaveValue('직접 수정한 본문');
  });

  it('실패한 초기화를 다시 시도하면 원문에서 초기화한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))
      .mockResolvedValueOnce(response('<p>기존 원문</p>'));
    setup();
    open();
    await tick();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(editor()).toHaveAttribute('contenteditable', 'false');
    await tick();
    expect(editor()).toHaveTextContent(post.body);
    expect(editor()).toHaveAttribute('contenteditable', 'true');
  });

  it('빈 초안은 요청 없이 빈 편집을 허용한다', () => {
    setup('');
    open();
    expect(editor()).toHaveAttribute('contenteditable', 'true');
    expect(fetch).not.toHaveBeenCalled();
    editor().innerHTML = '<p>새 본문</p>';
    fireEvent.input(editor());
    expect(source()).toHaveValue('새 본문');
  });
});
