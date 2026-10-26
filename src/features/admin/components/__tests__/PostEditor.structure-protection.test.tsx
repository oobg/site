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
  status: 'draft' as const,
  category_id: 'c1',
};
function setup(body: string) {
  const save = vi.fn(async (_previous: unknown, _data: FormData) => ({
    status: 'success' as const,
    message: '저장했습니다.',
  }));
  render(
    <PostEditor
      action={save}
      post={{ ...post, body }}
      categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
    />,
  );
  return save;
}

describe('P1 Markdown structure entry protection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ html: '<p>안전한 본문</p>' }))),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it.each([
    '\\# 일반 문장',
    '\\> 일반 문장',
    '\\- 일반 문장',
    '각주[^1]\n\n[^1]: 설명',
    '첫줄\n\\---',
    '- first\n  - child\n\n  continuation',
    '- first\n\n* second',
  ])('위험 구조 클릭 진입 차단과 저장 원문 유지: %s', async (body) => {
    const save = setup(body);
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '원문 구조를 유지하려면 마크다운으로 편집해 주세요.',
    );
    expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue(body);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '초안 저장' })));
    expect(save.mock.calls[0]?.[1].get('body')).toBe(body);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['ArrowRight', 'ArrowLeft', 'End', 'Home'])(
    '키보드 %s도 위험 원문을 텍스트 편집으로 넘기지 않는다',
    (key) => {
      setup('\\# 일반 문장');
      fireEvent.keyDown(screen.getByRole('tab', { name: '마크다운' }), { key });
      expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue('\\# 일반 문장');
    },
  );

  it('원문을 안전한 서식으로 수정하면 다시 진입할 수 있다', async () => {
    setup('각주[^1]\n\n[^1]: 설명');
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.change(screen.getByRole('textbox', { name: '본문' }), {
      target: { value: '## 제목\n\n**본문**' },
    });
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    expect(screen.getByRole('textbox', { name: '본문 텍스트 편집' })).toHaveAttribute(
      'contenteditable',
      'true',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('미리보기 진입 직후 복구된 위험 원문은 마크다운으로 안내한다', async () => {
    window.sessionStorage.setItem(
      'admin-post-editor-draft:p1',
      JSON.stringify({
        version: 1,
        title: '복구 제목',
        slug: 'restored',
        description: '설명',
        body: '\\# 복구 원문',
        status: 'draft',
        categoryId: 'c1',
        tags: '',
        coverKey: '',
        coverUrl: '',
        coverAlt: '',
        coverX: 0.5,
        coverY: 0.5,
        slugEdited: false,
        savedAt: '2026-10-26',
      }),
    );
    setup('안전한 원문');
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue('\\# 복구 원문');
    expect(screen.getByRole('alert')).toHaveTextContent('마크다운으로 편집해 주세요.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('미리보기에서 임시 저장을 버릴 때 위험한 기존 원문을 다시 초기화하지 않는다', async () => {
    window.sessionStorage.setItem(
      'admin-post-editor-draft:p1',
      JSON.stringify({
        version: 1,
        title: '복구 제목',
        slug: 'restored',
        description: '설명',
        body: '안전한 복구 본문',
        status: 'draft',
        categoryId: 'c1',
        tags: '',
        coverKey: '',
        coverUrl: '',
        coverAlt: '',
        coverX: 0.5,
        coverY: 0.5,
        slugEdited: false,
        savedAt: '2026-10-26',
      }),
    );
    setup('각주[^1]\n\n[^1]: 설명');
    await act(async () => vi.advanceTimersByTimeAsync(0));
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    fireEvent.click(screen.getByRole('button', { name: '임시 저장 버리기' }));
    expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue('각주[^1]\n\n[^1]: 설명');
    expect(screen.getByRole('alert')).toHaveTextContent('마크다운으로 편집해 주세요.');
  });

  it('진입 후 한글 조합 입력 중에는 구조 검사로 편집을 재잠그지 않는다', async () => {
    setup('안전한 본문');
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    const visual = screen.getByRole('textbox', { name: '본문 텍스트 편집' });
    fireEvent.compositionStart(visual);
    visual.innerHTML = '<p># ㅎ</p>';
    fireEvent.input(visual, { isComposing: true });
    expect(visual).toHaveAttribute('contenteditable', 'true');
    expect(screen.getByRole('tab', { name: '텍스트 편집' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    visual.innerHTML = '<p># 한글</p>';
    fireEvent.input(visual);
    fireEvent.compositionEnd(visual);
    expect(visual).toHaveAttribute('contenteditable', 'true');
  });
});
