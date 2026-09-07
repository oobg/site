import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PostEditor } from '@features/admin/components/PostEditor';

const router = { replace: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const action = vi.fn(async () => ({ status: 'idle' as const, message: '' }));

describe('PostEditor slug editing', () => {
  beforeEach(() => {
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
  });

  it('creates a Korean slug while a new title is entered', () => {
    render(<PostEditor action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '나의 첫 글' },
    });
    expect(screen.getByRole('textbox', { name: '슬러그' })).toHaveValue('나의-첫-글');
  });

  it('keeps IME composition text until composition ends', () => {
    render(<PostEditor action={action} />);
    const slug = screen.getByRole('textbox', { name: '슬러그' });

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
    expect(screen.getByRole('textbox', { name: '슬러그' })).toHaveValue('existing-slug');
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

    fireEvent.click(screen.getByRole('button', { name: '제목으로 생성' }));
    expect(screen.getByRole('textbox', { name: '슬러그' })).toHaveValue('나의-첫-글');
    expect(screen.getByText('저장하지 않은 변경이 있어요.')).toBeInTheDocument();
  });

  it('keeps the Markdown body while switching editor tabs', () => {
    render(<PostEditor action={action} />);
    const body = screen.getByRole('textbox', { name: '본문' });
    const writePanel = screen.getByRole('tabpanel', { name: '작성' });

    fireEvent.change(body, { target: { value: '## 작성 중인 본문' } });
    fireEvent.click(screen.getByRole('tab', { name: '미리보기' }));
    expect(screen.getByRole('tab', { name: '미리보기' })).toHaveAttribute('aria-selected', 'true');
    expect(writePanel).toHaveAttribute('hidden');
    expect(screen.getByRole('tabpanel', { name: '미리보기' })).not.toHaveAttribute('hidden');
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });

    expect(screen.getByRole('tab', { name: '작성' })).toHaveAttribute('aria-selected', 'true');
    expect(body).toHaveValue('## 작성 중인 본문');
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

    fireEvent.click(screen.getByRole('tab', { name: '미리보기' }));
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

    fireEvent.click(screen.getByRole('tab', { name: '미리보기' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      '본문을 입력하면 여기에 미리보기가 표시돼요.',
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
