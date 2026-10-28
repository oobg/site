import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostEditor } from '@features/admin/components/PostEditor';
import { renderMarkdown } from '@lib/markdown/render';

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
const src = '/assets/embeds/2026-10-06/abcd.html';

describe('PostEditor HTML embeds', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('HTML 업로드 결과를 커서 위치에 embed fence로 삽입한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: src }))));
    render(<PostEditor action={async () => ({ status: 'idle', message: '' })} />);
    const body = screen.getByRole('textbox', { name: '본문' }) as HTMLTextAreaElement;
    fireEvent.change(body, { target: { value: '앞뒤' } });
    body.setSelectionRange(1, 1);
    const input = screen.getByLabelText('본문 HTML 임베드 선택');
    expect(input).toHaveAttribute('accept', 'text/html,.html');
    fireEvent.change(input, {
      target: {
        files: [new File(['<!doctype html><html></html>'], 'gallery.html', { type: 'text/html' })],
      },
    });
    await act(async () => Promise.resolve());
    expect(body).toHaveValue(
      `앞\n\n\`\`\`embed\n${JSON.stringify({ src, title: 'gallery' })}\n\`\`\`\n\n뒤`,
    );
    expect(screen.getByText('본문에 임베드 블록을 넣었어요.')).toBeInTheDocument();
  });

  it('초기화가 끝난 텍스트 편집에서 다른 문단을 수정하고 원문 fence를 그대로 저장한다', async () => {
    const fence =
      '```embed\n{\n  "src": "/assets/embeds/2026-10-06/abcd.html",\n  "title": "그림 & <한글>",\n  "height": 640\n}\n```';
    const source = `앞 문단\n\n${fence}\n\n뒤 문단`;
    const { html } = await renderMarkdown(source, { assetPublicUrl: 'https://cdn.raven.kr' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ html }))));
    const save = vi
      .fn<(previous: unknown, data: FormData) => Promise<{ status: 'success'; message: string }>>()
      .mockResolvedValue({ status: 'success', message: '저장했습니다.' });
    render(
      <PostEditor
        action={save}
        post={{ ...post, body: source }}
        categories={[{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: true }]}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: '텍스트 편집' }));
    const visual = screen.getByRole('textbox', { name: '본문 텍스트 편집' });
    expect(visual).toHaveAttribute('contenteditable', 'false');
    expect(screen.getByLabelText('본문 HTML 임베드 선택')).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(350));
    expect(visual).toHaveAttribute('contenteditable', 'true');
    const figure = visual.querySelector('[data-embed]');
    expect(figure).toHaveAttribute('contenteditable', 'false');
    expect(figure?.querySelector('iframe')).toHaveAttribute('sandbox', 'allow-scripts');
    visual.querySelector('p')!.textContent = '고친 앞 문단';
    fireEvent.input(visual);
    fireEvent.click(screen.getByRole('tab', { name: '마크다운' }));
    const expected = `고친 앞 문단\n\n${fence}\n\n뒤 문단`;
    expect(screen.getByRole('textbox', { name: '본문' })).toHaveValue(expected);
    await act(async () =>
      fireEvent.submit(screen.getByRole('textbox', { name: '제목' }).closest('form')!),
    );
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0]?.[1].get('body')).toBe(expected);
  });

  it('대표 이미지 입력의 accept 우회 HTML 선택은 업로드하지 않는다', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<PostEditor action={async () => ({ status: 'idle', message: '' })} />);
    fireEvent.change(screen.getByLabelText('이미지 변경'), {
      target: { files: [new File(['<!doctype html>'], 'a.html', { type: 'text/html' })] },
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getByText('대표 이미지는 JPEG, PNG, GIF, WebP 파일만 올릴 수 있어요.'),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="cover_image_key"]')).toHaveValue('');
  });

  it('정상 이미지 MIME을 선택해도 HTML 경로 응답은 대표 이미지에 반영하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ path: src, publicUrl: `https://cdn.raven.kr${src}` })),
        ),
    );
    render(<PostEditor action={async () => ({ status: 'idle', message: '' })} />);
    fireEvent.change(screen.getByLabelText('이미지 변경'), {
      target: { files: [new File(['image'], 'a.png', { type: 'image/png' })] },
    });
    await act(async () => Promise.resolve());
    expect(screen.getByText('대표 이미지를 업로드하지 못했습니다.')).toBeInTheDocument();
    expect(document.querySelector('input[name="cover_image_key"]')).toHaveValue('');
    expect(document.querySelector('input[name="cover_image_url"]')).toHaveValue('');
  });
});
