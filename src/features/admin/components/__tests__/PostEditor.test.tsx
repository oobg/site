import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StrictMode } from 'react';
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
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'navigation');
    Reflect.deleteProperty(navigator, 'clipboard');
    vi.restoreAllMocks();
  });

  it('입력의 기존 이름을 유지하고 최대 길이 도움말을 연결한다', () => {
    render(<PostEditor action={action} />);
    for (const [name, limit] of [
      ['제목', '160자'],
      ['설명', '500자'],
      ['URL', '160자'],
      ['태그', '30개'],
      ['대체 텍스트', '300자'],
    ]) {
      expect(screen.getByRole('textbox', { name })).toHaveAccessibleDescription(
        expect.stringContaining(limit),
      );
    }
    expect(screen.getByRole('textbox', { name: '태그' })).toHaveAccessibleDescription(
      expect.stringContaining('80자'),
    );
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
    expect(screen.getByText('서버에 저장하지 않은 변경이 있어요.')).toBeInTheDocument();
  });

  it('debounces a new-post snapshot and exposes its saved state inline', () => {
    vi.useFakeTimers();
    render(<PostEditor action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '임시 제목' },
    });
    expect(screen.getByText('이 탭에 임시 보관 중…')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('admin-post-editor-draft:new')).toBeNull();

    act(() => vi.advanceTimersByTime(499));
    expect(window.sessionStorage.getItem('admin-post-editor-draft:new')).toBeNull();
    act(() => vi.advanceTimersByTime(1));

    expect(JSON.parse(window.sessionStorage.getItem('admin-post-editor-draft:new')!)).toMatchObject(
      {
        version: 1,
        title: '임시 제목',
        slug: '임시-제목',
      },
    );
    expect(screen.getByText('이 탭에 임시 보관됨 · 서버 저장 전')).toBeInTheDocument();
  });

  it('restores an existing-post snapshot and can discard it without a modal', async () => {
    window.sessionStorage.setItem(
      'admin-post-editor-draft:p1',
      JSON.stringify({
        version: 1,
        title: '복구된 제목',
        slug: 'restored-title',
        description: '복구된 설명',
        body: '복구된 본문',
        status: 'draft',
        categoryId: '',
        tags: '',
        coverKey: '',
        coverUrl: '',
        coverAlt: '',
        coverX: 0.5,
        coverY: 0.5,
        slugEdited: true,
        savedAt: new Date().toISOString(),
      }),
    );

    render(
      <PostEditor
        action={action}
        post={{
          id: 'p1',
          title: '서버 제목',
          slug: 'server-title',
          description: '서버 설명',
          body: '서버 본문',
          status: 'draft',
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('복구된 제목'),
    );
    expect(
      screen.getByText(
        '이 브라우저 탭의 임시 보관 내용을 복구했어요. 서버에 저장된 내용은 아직 바뀌지 않았어요.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '임시 저장 버리기' }));

    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('서버 제목');
    expect(
      screen.queryByText(
        '이 브라우저 탭의 임시 보관 내용을 복구했어요. 서버에 저장된 내용은 아직 바뀌지 않았어요.',
      ),
    ).toBeNull();
    expect(window.sessionStorage.getItem('admin-post-editor-draft:p1')).toBeNull();
  });

  it('removes the snapshot after a successful server save', async () => {
    const save = vi.fn(async () => ({ status: 'success' as const, message: '저장했습니다.' }));
    window.sessionStorage.setItem(
      'admin-post-editor-draft:p1',
      JSON.stringify({
        version: 1,
        title: '복구된 제목',
        slug: 'restored-title',
        description: '설명',
        body: '본문',
        status: 'draft',
        categoryId: 'c1',
        tags: '',
        coverKey: '',
        coverUrl: '',
        coverAlt: '',
        coverX: 0.5,
        coverY: 0.5,
        slugEdited: true,
        savedAt: new Date().toISOString(),
      }),
    );
    render(
      <PostEditor
        action={save}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
        post={{
          id: 'p1',
          title: '서버 제목',
          slug: 'server-title',
          description: '설명',
          body: '본문',
          status: 'draft',
          category_id: 'c1',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '초안 저장' }));
    await screen.findByText('저장했습니다.');
    expect(window.sessionStorage.getItem('admin-post-editor-draft:p1')).toBeNull();
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
    expect(body).toHaveAttribute('data-editor-scroll-region');
    body.focus();
    body.scrollTop = 240;
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
    expect(body.scrollTop).toBe(240);
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

  it('activates code copy buttons in the rendered visual preview', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          html: '<figure data-code><button type="button" data-code-copy><span data-code-copy-status>코드 복사</span></button><pre><code>npm install raven</code></pre></figure>',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    render(
      <PostEditor
        action={action}
        post={{
          id: 'p1',
          title: '설치',
          slug: 'install',
          description: '설명',
          body: '```sh\nnpm install raven\n```',
          status: 'draft',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    const copy = screen.getByRole('button', { name: '코드 복사' });
    await act(async () => fireEvent.click(copy));

    expect(writeText).toHaveBeenCalledWith('npm install raven');
    expect(copy).toHaveAttribute('data-copied');
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

  it('keeps the visual editor caret and viewport stable while syncing input', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ html: '<p>기존 본문</p>' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(
      <PostEditor
        action={action}
        post={{
          id: 'p1',
          title: '제목',
          slug: 'title',
          description: '설명',
          body: '기존 본문',
          status: 'draft',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    const panel = screen.getByRole('tabpanel', { name: '텍스트 편집' });
    const visualEditor = screen.getByRole('textbox', { name: '본문 텍스트 편집' });
    const textNode = visualEditor.querySelector('p')?.firstChild;
    expect(textNode).toBeInstanceOf(Text);
    expect(panel).toHaveAttribute('data-editor-scroll-region');

    panel.scrollTop = 180;
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(textNode!, 2);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    (textNode as Text).insertData(2, '수정');
    fireEvent.input(visualEditor);

    expect(textNode?.isConnected).toBe(true);
    expect(selection?.anchorNode).toBe(textNode);
    expect(panel.scrollTop).toBe(180);
    expect(document.querySelector<HTMLTextAreaElement>('textarea[name="body"]')).toHaveValue(
      '기존수정 본문',
    );
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

describe('editor recovery regressions', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('restores a snapshot when StrictMode replays effects', async () => {
    window.sessionStorage.setItem(
      'admin-post-editor-draft:new',
      JSON.stringify({
        version: 1,
        title: '복구할 제목',
        slug: 'recovered',
        description: '설명',
        body: '본문',
        status: 'draft',
        categoryId: '',
        tags: '',
        coverKey: '',
        coverUrl: '',
        coverAlt: '',
        coverX: 0.5,
        coverY: 0.5,
        slugEdited: true,
        savedAt: new Date().toISOString(),
      }),
    );
    render(
      <StrictMode>
        <PostEditor action={action} />
      </StrictMode>,
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('복구할 제목'),
    );
  });

  it('preserves text typed while a selected-range image upload is pending', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    render(<PostEditor action={action} />);
    const body = screen.getByRole('textbox', { name: '본문' }) as HTMLTextAreaElement;
    fireEvent.change(body, { target: { value: '기존 본문' } });
    body.setSelectionRange(0, 2);
    fireEvent.change(screen.getByLabelText('본문 이미지 선택'), {
      target: { files: [new File(['x'], 'image.png', { type: 'image/png' })] },
    });
    fireEvent.change(body, { target: { value: '새로 입력한 소중한 본문' } });
    await act(async () =>
      finish(new Response(JSON.stringify({ url: '/assets/posts/2026-10-15/abcd.png' }))),
    );
    expect(body.value).toBe(
      '새로 입력한 소중한 본문\n\n![image](/assets/posts/2026-10-15/abcd.png)',
    );
  });

  it.each([
    ['업로드 중 작성한 정확한 설명', '업로드 중 작성한 정확한 설명'],
    ['', 'cover image'],
  ])(
    '커버 업로드 완료 시 최신 대체 텍스트 %s를 보존하거나 빈 값만 채운다',
    async (typed, expected) => {
      let finish!: (value: Response) => void;
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise<Response>((resolve) => {
              finish = resolve;
            }),
        ),
      );
      render(<PostEditor action={action} />);
      fireEvent.change(screen.getByLabelText('이미지 변경'), {
        target: { files: [new File(['x'], 'cover-image.png', { type: 'image/png' })] },
      });
      const alt = screen.getByRole('textbox', { name: '대체 텍스트' });
      expect(alt).not.toBeDisabled();
      fireEvent.change(alt, { target: { value: typed } });
      await act(async () =>
        finish(
          new Response(
            JSON.stringify({
              path: '/assets/cover-image.png',
              publicUrl: 'https://assets.example.test/cover-image.png',
            }),
          ),
        ),
      );
      expect(alt).toHaveValue(expected);
      expect(screen.getByText('대표 이미지를 올렸어요.')).toBeInTheDocument();
    },
  );

  it('handles a null cover upload response as an upload failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null')));
    render(<PostEditor action={action} />);
    fireEvent.change(screen.getByLabelText('이미지 변경'), {
      target: { files: [new File(['x'], 'cover.png', { type: 'image/png' })] },
    });
    await waitFor(() =>
      expect(screen.getByText('대표 이미지를 업로드하지 못했습니다.')).toBeInTheDocument(),
    );
  });
  it('uses each successful server revision for the next save', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({
        status: 'success',
        message: '첫 서버 저장 완료',
        updatedAt: '2026-09-02T00:00:00.000Z',
      })
      .mockResolvedValueOnce({
        status: 'success',
        message: '다음 서버 저장 완료',
        updatedAt: '2026-09-03T00:00:00.000Z',
      });
    render(
      <PostEditor
        action={save}
        post={{
          id: 'p1',
          updated_at: '2026-09-01T00:00:00.000Z',
          title: '제목',
          slug: 'slug',
          description: '설명',
          body: '본문',
          status: 'draft',
        }}
      />,
    );
    const form = screen.getByRole('textbox', { name: '제목' }).closest('form')!;
    fireEvent.submit(form);
    await screen.findByText('첫 서버 저장 완료');
    expect(save.mock.calls[0][1].get('expectedUpdatedAt')).toBe('2026-09-01T00:00:00.000Z');
    fireEvent.submit(form);
    await screen.findByText('다음 서버 저장 완료');
    expect(save.mock.calls[1][1].get('expectedUpdatedAt')).toBe('2026-09-02T00:00:00.000Z');
  });
  it('retains input and the original revision after a conflict, including the recovery snapshot', async () => {
    const save = vi.fn().mockResolvedValue({
      status: 'error',
      message: '다른 곳에서 수정했어요.',
      fieldErrors: { expectedUpdatedAt: ['최신 글을 확인해 주세요.'] },
    });
    render(
      <PostEditor
        action={save}
        post={{
          id: 'p1',
          updated_at: '2026-09-01T00:00:00.000Z',
          title: '제목',
          slug: 'slug',
          description: '설명',
          body: '본문',
          status: 'draft',
        }}
      />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: '본문' }), {
      target: { value: '지우면 안 되는 내용' },
    });
    fireEvent.submit(screen.getByRole('textbox', { name: '제목' }).closest('form')!);
    expect(await screen.findByRole('heading', { name: '최신 글을 확인해 주세요' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue('지우면 안 되는 내용');
    expect(screen.getByRole('link', { name: '최신 글을 새 탭에서 확인' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    await waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem('admin-post-editor-draft:p1')!)).toMatchObject({
        body: '지우면 안 되는 내용',
        expectedUpdatedAt: '2026-09-01T00:00:00.000Z',
      }),
    );
    expect(router.replace).not.toHaveBeenCalled();
    fireEvent.submit(screen.getByRole('textbox', { name: '제목' }).closest('form')!);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1][1].get('expectedUpdatedAt')).toBe('2026-09-01T00:00:00.000Z');
  });
  it('does not silently rebase a recovered draft onto a newer server revision', async () => {
    sessionStorage.setItem(
      'admin-post-editor-draft:p1',
      JSON.stringify({
        version: 1,
        expectedUpdatedAt: '2026-09-01T00:00:00.000Z',
        title: '복원 제목',
        slug: 'slug',
        description: '설명',
        body: '복원 본문',
        status: 'draft',
        categoryId: '',
        tags: '',
        coverKey: '',
        coverUrl: '',
        coverAlt: '',
        coverX: 0.5,
        coverY: 0.5,
        slugEdited: true,
        savedAt: '2026-09-01T01:00:00.000Z',
      }),
    );
    const save = vi.fn().mockResolvedValue({ status: 'idle', message: '' });
    render(
      <PostEditor
        action={save}
        post={{
          id: 'p1',
          updated_at: '2026-09-02T00:00:00.000Z',
          title: '서버 제목',
          slug: 'slug',
          description: '설명',
          body: '서버 본문',
          status: 'draft',
        }}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('복원 제목'),
    );
    fireEvent.submit(screen.getByRole('textbox', { name: '제목' }).closest('form')!);
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][1].get('expectedUpdatedAt')).toBe('2026-09-01T00:00:00.000Z');
  });
  it('links the server error summary to the actual body field and restores write-mode focus', async () => {
    const save = vi.fn().mockResolvedValue({
      status: 'error',
      message: '입력값을 확인해 주세요.',
      fieldErrors: { body: ['본문을 확인해 주세요.'] },
    });
    render(
      <PostEditor
        action={save}
        post={{
          id: 'p1',
          updated_at: '2026-09-01T00:00:00Z',
          title: '제목',
          slug: 'slug',
          description: '설명',
          body: '본문',
          status: 'draft',
        }}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    fireEvent.submit(screen.getByRole('textbox', { name: '제목' }).closest('form')!);
    fireEvent.click(await screen.findByRole('link', { name: '본문을 확인해 주세요.' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: '본문' })).toHaveFocus());
    expect(screen.getByRole('tab', { name: '마크다운' })).toHaveAttribute('aria-selected', 'true');
  });
});
