import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PostEditor } from '@features/admin/components/PostEditor';

const router = { replace: vi.fn() };
const mocks = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

const action = vi.fn(async () => ({ status: 'idle' as const, message: '' }));

describe('PostEditor slug editing', () => {
  beforeEach(() => {
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    router.replace.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ html: '<p>미리보기</p>' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'navigation');
    vi.restoreAllMocks();
  });

  it('creates a Korean slug while a new title is entered', () => {
    render(<PostEditor action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '나의 첫 글' },
    });
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('나의-첫-글');
  });

  it('keeps IME composition text until composition ends', () => {
    render(<PostEditor action={action} />);
    const slug = screen.getByRole('textbox', { name: 'URL' });

    fireEvent.compositionStart(slug);
    fireEvent.change(slug, { target: { value: '나의 첫 글' } });
    expect(slug).toHaveValue('나의 첫 글');

    fireEvent.compositionEnd(slug);
    expect(slug).toHaveValue('나의-첫-글');
  });

  it('does not change an existing slug when its title changes', () => {
    render(
      <PostEditor
        action={action}
        post={{
          id: '8e10a748-fd28-41a0-9f3d-8b81fc40c753',
          title: '기존 제목',
          slug: 'existing-slug',
          description: '설명',
          body: '본문',
          status: 'draft',
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '바뀐 제목' },
    });
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('existing-slug');
  });

  it('replaces the slug from the title only when requested', () => {
    render(
      <PostEditor
        action={action}
        post={{
          id: '8e10a748-fd28-41a0-9f3d-8b81fc40c753',
          title: '나의 첫 글',
          slug: 'existing-slug',
          description: '설명',
          body: '본문',
          status: 'draft',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '재생성' }));
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('나의-첫-글');
    expect(screen.getByText('저장하지 않은 변경이 있어요.')).toBeInTheDocument();
  });

  it('keeps the Markdown body while switching editor tabs', () => {
    render(<PostEditor action={action} />);
    const body = screen.getByRole('textbox', { name: '본문' }) as HTMLTextAreaElement;
    const writePanel = screen.getByRole('tabpanel', { name: '마크다운' });

    fireEvent.change(body, { target: { value: '## 작성 중인 본문' } });
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    expect(screen.getByRole('tab', { name: '텍스트 편집' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(writePanel).toHaveAttribute('hidden');
    expect(screen.getByRole('tabpanel', { name: '텍스트 편집' })).not.toHaveAttribute('hidden');
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });

    expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute('aria-selected', 'true');
    expect(body).toHaveValue('## 작성 중인 본문');
  });

  it('leaves textarea sizing to CSS while typing and preserves the caret', () => {
    render(<PostEditor action={action} />);
    const body = screen.getByRole('textbox', { name: '본문' }) as HTMLTextAreaElement;

    expect(body.style.height).toBe('');
    body.focus();
    fireEvent.change(body, { target: { value: '입력 중인 본문' } });
    body.setSelectionRange(4, 4);
    fireEvent.compositionStart(body);
    fireEvent.change(body, {
      target: { value: '입력 중인 한글 본문', selectionStart: 4, selectionEnd: 4 },
    });

    expect(body.style.height).toBe('');
    expect(body).toHaveFocus();
    expect(body.selectionStart).toBe(4);
    expect(body.selectionEnd).toBe(4);
  });

  it('keeps the preview tab open after saving', async () => {
    const save = vi.fn(async () => ({ status: 'idle' as const, message: '' }));
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: 'p1',
          title: '제목',
          slug: 'title',
          description: '설명',
          body: '본문',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    const writePanel = document.getElementById('editor-write-panel');
    const previewPanel = document.getElementById('editor-preview-panel');
    expect(writePanel).not.toBeNull();
    expect(previewPanel).not.toBeNull();
    expect(screen.getByRole('tab', { name: '텍스트 편집' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(writePanel).toHaveAttribute('hidden');

    fireEvent.click(screen.getByRole('button', { name: '초안 저장' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());

    expect(screen.getByRole('tab', { name: '텍스트 편집' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(writePanel).toHaveAttribute('hidden');
    expect(previewPanel).not.toHaveAttribute('hidden');
  });

  it('requests a debounced preview only after opening the preview tab', () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(fetch);
    render(<PostEditor action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: '본문' }), {
      target: { value: '## 최신 본문' },
    });
    act(() => vi.advanceTimersByTime(400));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    act(() => vi.advanceTimersByTime(349));
    expect(fetchMock).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/preview',
      expect.objectContaining({ body: JSON.stringify({ markdown: '## 최신 본문' }) }),
    );
  });

  it('shows the empty-body guidance when opening preview initially', () => {
    render(<PostEditor action={action} />);

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      '본문을 입력하면 여기에 미리보기가 표시돼요.',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles an invalid preview response without crashing', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    render(<PostEditor action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: '본문' }), {
      target: { value: '본문' },
    });
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));

    expect(screen.getByRole('status')).toHaveTextContent('미리보기를 만들지 못했습니다.');
  });

  it('syncs visual text edits back to the Markdown body and save payload', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ html: '<h2>제목</h2><p>기존 <strong>본문</strong></p>' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const save = vi.fn(async (previous: unknown, formData: FormData) => {
      void previous;
      void formData;
      return { status: 'success' as const, message: '저장했습니다.' };
    });
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: 'p1',
          title: '제목',
          slug: 'title',
          description: '설명',
          body: '## 제목\n\n기존 **본문**',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    const markdownBody = screen.getByRole('textbox', { name: '본문' });
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    const visualEditor = screen.getByRole('textbox', { name: '본문 텍스트 편집' });
    const renderedLink = document.createElement('a');
    renderedLink.href = '#same-page';
    renderedLink.textContent = '이동하지 않는 링크';
    visualEditor.append(renderedLink);
    expect(
      renderedLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    ).toBe(false);
    visualEditor.innerHTML = '<h2>바뀐 제목</h2><p>수정한 <strong>본문</strong></p>';
    fireEvent.input(visualEditor);

    expect(markdownBody).toHaveValue('## 바뀐 제목\n\n수정한 **본문**');
    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: '초안 저장' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]?.[1].get('body')).toBe('## 바뀐 제목\n\n수정한 **본문**');
  });

  it('keeps edited filetree structure in the Markdown save payload', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          html: `
            <figure data-filetree>
              <figcaption>파일 구조</figcaption>
              <ul role="tree">
                <li data-kind="folder"><span data-filetree-name>project/</span>
                  <ul role="group">
                    <li data-kind="folder"><span data-filetree-name>src/</span>
                      <ul role="group">
                        <li data-kind="file"><span data-filetree-name>index.ts</span></li>
                      </ul>
                    </li>
                    <li data-kind="file"><span data-filetree-name>README.md</span></li>
                  </ul>
                </li>
              </ul>
            </figure>
          `,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const save = vi.fn(async (previous: unknown, formData: FormData) => {
      void previous;
      void formData;
      return { status: 'success' as const, message: '저장했습니다.' };
    });
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: 'p1',
          title: '파일 구조',
          slug: 'file-tree',
          description: '설명',
          body: '```filetree\nproject/\n└── README.md\n```',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    const visualEditor = screen.getByRole('textbox', { name: '본문 텍스트 편집' });
    const rootName = visualEditor.querySelector('[data-filetree-name]');
    expect(rootName).not.toBeNull();
    rootName!.textContent = 'workspace/';
    fireEvent.input(visualEditor);

    expect(document.querySelector<HTMLTextAreaElement>('textarea[name="body"]')).toHaveValue(
      '```filetree\nworkspace/\n├── src/\n│   └── index.ts\n└── README.md\n```',
    );
    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: '초안 저장' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]?.[1].get('body')).toBe(
      '```filetree\nworkspace/\n├── src/\n│   └── index.ts\n└── README.md\n```',
    );
  });

  it('disables Markdown tools while editing rendered text', () => {
    render(<PostEditor action={action} />);

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));

    expect(screen.getByRole('button', { name: '굵게' })).toBeDisabled();
    expect(screen.getByText('서식 도구는 마크다운 모드에서 사용할 수 있어요.')).toBeVisible();
  });

  it('keeps save success distinct when browser query invalidation fails', async () => {
    mocks.invalidateQueries.mockRejectedValueOnce(new Error('cache unavailable'));
    const save = vi.fn(async () => ({
      status: 'success' as const,
      message: '글을 수정했습니다.',
    }));
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: '8e10a748-fd28-41a0-9f3d-8b81fc40c753',
          title: '기존 제목',
          slug: 'existing-slug',
          description: '설명',
          body: '본문',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '저장할 제목' },
    });
    fireEvent.click(screen.getByRole('button', { name: '초안 저장' }));

    expect(await screen.findByText(/글을 수정했습니다/)).toHaveTextContent(
      '화면의 최신 목록은 새로고침하면 확인할 수 있어요.',
    );
  });

  it('makes the editor inert while a new post save is pending', async () => {
    let finish!: (value: { status: 'success'; message: string; postId: string }) => void;
    const save = vi.fn(
      () =>
        new Promise<{ status: 'success'; message: string; postId: string }>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
      />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), { target: { value: '새 글' } });
    fireEvent.change(screen.getByRole('textbox', { name: '설명' }), {
      target: { value: '설명입니다' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문' }), {
      target: { value: '본문입니다' },
    });
    fireEvent.click(screen.getByRole('button', { name: '초안 만들기' }));

    const form = screen.getByRole('textbox', { name: '제목' }).closest('form');
    expect(form).toHaveAttribute('inert');
    finish({ status: 'success', message: '글을 저장했습니다.', postId: 'p2' });
    expect(await screen.findByText('글을 저장했습니다.')).toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith('/admin/posts/p2');
  });

  it('inserts Markdown formatting and returns focus to the body', () => {
    render(<PostEditor action={action} />);
    const body = screen.getByRole('textbox', { name: '본문' }) as HTMLTextAreaElement;
    fireEvent.change(body, { target: { value: '선택 문장' } });
    body.focus();
    body.setSelectionRange(0, 5);

    fireEvent.click(screen.getByRole('button', { name: '굵게' }));

    expect(body).toHaveValue('**선택 문장**');
    expect(body).toHaveFocus();
  });

  it('places the body editor before settings in the document focus order', () => {
    render(<PostEditor action={action} />);
    const body = screen.getByRole('textbox', { name: '본문' });
    const settings = screen.getByRole('complementary', { name: '글 설정' });

    expect(body.compareDocumentPosition(settings) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it('shows the current cover in an accessible lightbox and restores trigger focus', async () => {
    render(
      <PostEditor
        action={action}
        post={{
          id: 'p1',
          title: '대표 이미지가 있는 글',
          slug: 'post-with-cover',
          description: '설명',
          body: '본문',
          status: 'draft',
          cover_image_url: 'https://cdn.raven.kr/cover.png',
          cover_alt: '절벽 위의 등대',
        }}
      />,
    );

    const trigger = screen.getByRole('button', { name: '크게 보기' });
    expect(trigger).toHaveAttribute('type', 'button');
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: '대표 이미지 크게 보기' });
    expect(within(dialog).getByRole('img', { name: '절벽 위의 등대' })).toHaveAttribute(
      'src',
      'https://cdn.raven.kr/cover.png',
    );
    const closeButton = within(dialog).getByRole('button', {
      name: '대표 이미지 크게 보기 닫기',
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('does not show the cover lightbox trigger without a cover image', () => {
    render(<PostEditor action={action} />);

    expect(screen.queryByRole('button', { name: '크게 보기' })).not.toBeInTheDocument();
  });

  it('keeps the secondary action as a draft save even when a draft status select shows public', async () => {
    const save = vi.fn(async (previous: unknown, formData: FormData) => {
      void previous;
      void formData;
      return { status: 'success' as const, message: '저장했습니다.' };
    });
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: 'p1',
          title: '초안',
          slug: 'draft-post',
          description: '설명',
          body: '본문',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: '상태' }), {
      target: { value: 'published' },
    });
    fireEvent.click(screen.getByRole('button', { name: '초안 저장' }));

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]?.[1].get('status')).toBe('draft');
  });

  it('submits the primary action with published status', async () => {
    const save = vi.fn(async (previous: unknown, formData: FormData) => {
      void previous;
      void formData;
      return { status: 'success' as const, message: '공개했습니다.' };
    });
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: 'p1',
          title: '초안',
          slug: 'draft-post',
          description: '설명',
          body: '본문',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '공개하기' }));

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]?.[1].get('status')).toBe('published');
    expect(screen.getByRole('combobox', { name: '상태' })).toHaveValue('published');
    expect(await screen.findByRole('button', { name: '저장' })).toHaveAttribute(
      'data-status',
      'published',
    );
  });
});
