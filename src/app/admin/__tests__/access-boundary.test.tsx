import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  posts: vi.fn(),
  categories: vi.fn(),
  post: vi.fn(),
  analytics: vi.fn(),
}));
vi.mock('@lib/auth/owner', () => ({ getOwnerAccess: mocks.access }));
vi.mock('@features/admin/services/posts.admin', () => ({
  listAdminPosts: mocks.posts,
  listAdminCategories: mocks.categories,
  getAdminPost: mocks.post,
}));
vi.mock('@features/admin/services/posts.actions', () => ({
  createPostAction: vi.fn(),
  updatePostAction: vi.fn(),
}));
vi.mock('@features/admin/components/AnalyticsSection', () => ({
  AnalyticsSection: mocks.analytics,
  AnalyticsSectionLoading: () => null,
}));
vi.mock('@features/admin/components/AdminWorkspace', () => ({
  AdminWorkspace: () => <p>보호 작업공간</p>,
}));
vi.mock('@features/admin/components/AdminEditorWorkspace', () => ({
  AdminEditorWorkspace: () => <p>보호 편집기</p>,
}));
vi.mock('@features/admin/components/PostEditor', () => ({ PostEditor: () => <p>보호 본문</p> }));
vi.mock('@features/admin/components/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <button>Google 로그인</button>,
}));
vi.mock('@/app/_container/CommandPalette', () => ({
  CommandPalette: () => <button>보호 검색</button>,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  notFound: () => {
    throw new Error('notFound');
  },
}));
import AdminPage from '@/app/admin/page';
import NewPost from '@/app/admin/posts/new/page';
import EditPost from '@/app/admin/posts/[id]/page';
import AnalyticsPage from '@/app/admin/analytics/page';
import AdminLayout from '@/app/admin/layout';

const cases = [
  {
    name: '미설정',
    configured: false,
    authenticated: false,
    authorized: false,
    email: null,
    text: '관리자 연결이 필요해요',
  },
  {
    name: '로그아웃',
    configured: true,
    authenticated: false,
    authorized: false,
    email: null,
    text: '작성자 계정으로 로그인',
  },
  {
    name: '비허용 계정',
    configured: true,
    authenticated: true,
    authorized: false,
    email: 'visitor@example.test',
    text: '이 계정은 접근할 수 없어요',
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.posts.mockResolvedValue([]);
  mocks.categories.mockResolvedValue([]);
});
describe('server admin authorization boundaries', () => {
  it.each(cases)('$name: all page guards avoid protected queries', async (access) => {
    mocks.access.mockResolvedValue(access);
    await AdminPage({ searchParams: Promise.resolve({}) });
    await NewPost();
    await EditPost({ params: Promise.resolve({ id: 'private-id' }) });
    await expect(AnalyticsPage()).rejects.toThrow('redirect:/admin');
    expect(mocks.posts).not.toHaveBeenCalled();
    expect(mocks.categories).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.analytics).not.toHaveBeenCalled();
  });
  it.each(cases)(
    '$name: server layout renders safe access content and excludes arbitrary children, nav, account and search',
    async (access) => {
      mocks.access.mockResolvedValue(access);
      render(await AdminLayout({ children: <p>비공개 본문</p> }));
      expect(screen.getByText(access.text)).toBeVisible();
      expect(screen.queryByText('비공개 본문')).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: '관리자 메뉴' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '계정 메뉴' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '보호 검색' })).not.toBeInTheDocument();
    },
  );
  it('owner reaches the protected workspace queries', async () => {
    mocks.access.mockResolvedValue({
      configured: true,
      authenticated: true,
      authorized: true,
      email: 'owner@example.test',
    });
    await AdminPage({ searchParams: Promise.resolve({}) });
    expect(mocks.posts).toHaveBeenCalledOnce();
    expect(mocks.categories).toHaveBeenCalledOnce();
  });
});
