import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actionMocks = vi.hoisted(() => ({
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
  reorderPinnedPostsAction: vi.fn(),
}));
vi.mock('@features/admin/services/categories.actions', () => actionMocks);
import { BlogSettings } from '@features/admin/components/BlogSettings';

const categories = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: '미분류',
    name: '미분류',
    sort_order: 99,
    is_default: true,
  },
  {
    id: '20000000-0000-4000-8000-000000000001',
    slug: 'dev',
    name: '개발',
    sort_order: 1,
    is_default: false,
  },
];
const posts = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: '첫 글',
    slug: 'first',
    status: 'published' as const,
    updated_at: '',
    created_at: '2025-01-01',
    cover_image_url: null,
    cover_alt: null,
    cover_position_x: 50,
    cover_position_y: 50,
    pin_order: 1,
    category_id: categories[0].id,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: '둘째 글',
    slug: 'second',
    status: 'published' as const,
    updated_at: '',
    created_at: '2024-01-01',
    cover_image_url: null,
    cover_alt: null,
    cover_position_x: 50,
    cover_position_y: 50,
    pin_order: 2,
    category_id: categories[1].id,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: '초안',
    slug: 'draft',
    status: 'draft' as const,
    updated_at: '',
    created_at: '2023-01-01',
    cover_image_url: null,
    cover_alt: null,
    cover_position_x: 50,
    cover_position_y: 50,
    pin_order: null,
    category_id: categories[0].id,
  },
];

function view(client = new QueryClient()) {
  return render(
    <QueryClientProvider client={client}>
      <BlogSettings categories={categories} posts={posts} />
    </QueryClientProvider>,
  );
}

describe('BlogSettings', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.restoreAllMocks());
  it('기본 카테고리의 변경과 삭제를 막는다', () => {
    view();
    expect(screen.getAllByRole('textbox', { name: '카테고리 이름' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '삭제' })[0]).toBeDisabled();
  });

  it('draft를 pin 후보에서 제외하고 이동 결과를 시각 순서와 form 순서에 반영한다', () => {
    const { container } = view();
    expect(screen.queryByText('초안')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('checkbox').map((checkbox) => checkbox.parentElement?.textContent),
    ).toEqual([expect.stringContaining('첫 글'), expect.stringContaining('둘째 글')]);
    fireEvent.click(screen.getByRole('button', { name: '둘째 글 위로' }));
    expect(container).toHaveTextContent('1.');
    expect(
      [...container.querySelectorAll('input[name="post_ids"]')].map(
        (node) => (node as HTMLInputElement).value,
      ),
    ).toEqual([posts[1].id, posts[0].id]);
  });

  it('대표 글 필터 뒤에도 선택된 글 전체를 hidden input으로 보존한다', () => {
    const { container } = view();
    fireEvent.change(screen.getByRole('combobox', { name: '대표 글 카테고리' }), {
      target: { value: categories[0].id },
    });
    expect(screen.queryByRole('checkbox', { name: /둘째 글/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('추천 글 노출 순서 미리보기')).toHaveTextContent('둘째 글');
    expect(
      [...container.querySelectorAll('input[name="post_ids"]')].map(
        (node) => (node as HTMLInputElement).value,
      ),
    ).toEqual([posts[0].id, posts[1].id]);
  });

  it.each([
    {
      button: '추가',
      index: 0,
      action: actionMocks.createCategoryAction,
      message: '카테고리를 추가하지 못했어요.',
    },
    {
      button: '저장',
      index: 1,
      action: actionMocks.updateCategoryAction,
      message: '카테고리를 저장하지 못했어요.',
    },
    {
      button: '삭제',
      index: 1,
      action: actionMocks.deleteCategoryAction,
      message: '카테고리를 삭제하지 못했어요.',
    },
    {
      button: '대표 순서 저장',
      index: 0,
      action: actionMocks.reorderPinnedPostsAction,
      message: '대표 글 순서를 저장하지 못했어요.',
    },
  ])(
    '$button 요청이 거절되면 오류를 표시하고 다시 시도할 수 있다',
    async ({ button, index, action, message }) => {
      action.mockRejectedValueOnce(new Error('network unavailable'));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      view();
      const submit = screen.getAllByRole('button', { name: button })[index];

      fireEvent.submit(submit.closest('form')!);

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(submit).toBeEnabled();
      expect(action).toHaveBeenCalledOnce();
    },
  );

  it('저장 후 캐시 갱신이 실패해도 저장 성공과 새로고침 방법을 표시한다', async () => {
    actionMocks.createCategoryAction.mockResolvedValue({
      status: 'success',
      message: '추가했어요.',
    });
    const client = new QueryClient();
    vi.spyOn(client, 'invalidateQueries').mockRejectedValue(new Error('cache unavailable'));
    view(client);

    fireEvent.submit(screen.getByRole('button', { name: '추가' }).closest('form')!);

    expect(await screen.findByRole('status')).toHaveTextContent(
      '추가했어요. 최신 내용을 보려면 새로고침해 주세요.',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(actionMocks.createCategoryAction).toHaveBeenCalledOnce();
  });

  it('삭제 실패 뒤 저장에 성공하면 가장 최근 저장 결과를 표시한다', async () => {
    actionMocks.deleteCategoryAction.mockResolvedValue({ status: 'error', message: '삭제 실패' });
    actionMocks.updateCategoryAction.mockResolvedValue({
      status: 'success',
      message: '이름을 저장했어요.',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    view();

    fireEvent.submit(screen.getAllByRole('button', { name: '삭제' })[1].closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('삭제 실패');
    fireEvent.submit(screen.getAllByRole('button', { name: '저장' })[1].closest('form')!);

    expect(await screen.findByRole('status')).toHaveTextContent('이름을 저장했어요.');
    expect(screen.queryByText('삭제 실패')).not.toBeInTheDocument();
  });

  it('같은 카테고리를 저장하는 동안 삭제를 잠근다', async () => {
    let finish!: (value: { status: 'success'; message: string }) => void;
    actionMocks.updateCategoryAction.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    view();

    fireEvent.submit(screen.getAllByRole('button', { name: '저장' })[1].closest('form')!);

    await waitFor(() => expect(screen.getAllByRole('button', { name: '삭제' })[1]).toBeDisabled());
    await act(async () => finish({ status: 'success', message: '저장했어요.' }));
    expect(screen.getAllByRole('button', { name: '삭제' })[1]).toBeEnabled();
  });
});

describe('P1 category URL UI protection', () => {
  beforeEach(() => vi.resetAllMocks());
  it('공개 글의 URL만 readonly로 두고 이름 변경 시 기존 slug를 함께 제출한다', async () => {
    actionMocks.updateCategoryAction.mockResolvedValue({
      status: 'success',
      message: '저장했습니다.',
    });
    view();
    const slug = screen.getAllByRole('textbox', { name: '카테고리 slug' })[1]!;
    const name = screen.getAllByRole('textbox', { name: '카테고리 이름' })[1]!;
    expect(slug).toHaveAttribute('readonly');
    expect(slug).not.toBeDisabled();
    expect(slug).toHaveAccessibleDescription(
      '공개 글의 기존 주소를 유지하기 위해 URL을 바꿀 수 없어요. 이름은 바꿀 수 있어요.',
    );
    expect(name).not.toHaveAttribute('readonly');
    expect(name).not.toBeDisabled();
    fireEvent.change(name, { target: { value: '새 개발 이름' } });
    await act(async () => fireEvent.submit(name.closest('form')!));
    const payload = actionMocks.updateCategoryAction.mock.calls[0]?.[1] as FormData;
    expect(payload.get('slug')).toBe('dev');
    expect(payload.get('name')).toBe('새 개발 이름');
  });
  it.each(['draft', 'none'] as const)('공개 글이 없는 %s 분류의 URL 편집은 허용한다', (kind) => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BlogSettings
          categories={categories}
          posts={kind === 'draft' ? [{ ...posts[1]!, status: 'draft' }] : []}
        />
      </QueryClientProvider>,
    );
    const slug = screen.getAllByRole('textbox', { name: '카테고리 slug' })[1]!;
    expect(slug).not.toHaveAttribute('readonly');
    expect(slug).not.toBeDisabled();
    fireEvent.change(slug, { target: { value: 'next' } });
    expect(slug).toHaveValue('next');
  });
});
