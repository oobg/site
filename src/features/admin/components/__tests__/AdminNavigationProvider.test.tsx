import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Link from 'next/link';
import {
  AdminNavigationProvider,
  useAdminNavigationGuard,
} from '@features/admin/components/AdminNavigationProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/posts/current' }));

function Editor({ dirty }: { dirty: boolean }) {
  useAdminNavigationGuard(dirty);
  return (
    <>
      <input aria-label="제목" defaultValue="보존할 초안" />
      <Link href="/admin/posts/next">다음 글</Link>
    </>
  );
}

describe('AdminNavigationProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'navigation', { configurable: true, value: undefined });
    Reflect.deleteProperty(window, '__ravenAdminPopGuard');
    window.history.replaceState({}, '', '/admin/posts/current');
  });

  it('dirty link를 한 번 묻고 취소 또는 수락한다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <AdminNavigationProvider>
        <Editor dirty />
      </AdminNavigationProvider>,
    );
    const link = screen.getByRole('link', { name: '다음 글' });
    expect(fireEvent.click(link)).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();

    confirm.mockClear().mockReturnValue(true);
    expect(fireEvent.click(link)).toBe(true);
    expect(confirm).toHaveBeenCalledOnce();
  });

  it('Navigation API가 없을 때 back 취소는 현재 entry로 복귀하고 입력을 보존한다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    render(
      <AdminNavigationProvider>
        <Editor dirty />
      </AdminNavigationProvider>,
    );
    const input = screen.getByRole('textbox', { name: '제목' });
    fireEvent.change(input, { target: { value: '수정 중인 제목' } });
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: { __ravenAdminHistoryIndex: -1 } }),
    );

    expect(confirm).toHaveBeenCalledOnce();
    expect(go).toHaveBeenCalledWith(1);
    expect(input).toHaveValue('수정 중인 제목');
    expect(window.location.pathname).toBe('/admin/posts/current');
  });

  it('fallback traversal 수락 시 history.go로 되돌리지 않는다', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    render(
      <AdminNavigationProvider>
        <Editor dirty />
      </AdminNavigationProvider>,
    );
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: { __ravenAdminHistoryIndex: -1 } }),
    );
    expect(go).not.toHaveBeenCalled();
  });

  it('저장으로 dirty가 해제되면 cleanup이 history를 움직이지 않고 guard도 제거한다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    const view = render(
      <AdminNavigationProvider>
        <Editor dirty />
      </AdminNavigationProvider>,
    );
    view.rerender(
      <AdminNavigationProvider>
        <Editor dirty={false} />
      </AdminNavigationProvider>,
    );
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: { __ravenAdminHistoryIndex: -1 } }),
    );
    expect(confirm).not.toHaveBeenCalled();
    expect(go).not.toHaveBeenCalled();
  });

  it('Navigation API traversal 취소는 navigate event를 막는다', () => {
    const navigation = new EventTarget();
    Object.defineProperty(window, 'navigation', { configurable: true, value: navigation });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <AdminNavigationProvider>
        <Editor dirty />
      </AdminNavigationProvider>,
    );
    const event = new Event('navigate', { cancelable: true });
    navigation.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('dirty 상태에서도 같은 URL의 서버 액션 갱신은 막지 않는다', () => {
    const navigation = new EventTarget();
    Object.defineProperty(window, 'navigation', { configurable: true, value: navigation });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <AdminNavigationProvider>
        <Editor dirty />
      </AdminNavigationProvider>,
    );
    const event = new Event('navigate', { cancelable: true });
    Object.defineProperty(event, 'destination', {
      value: { url: window.location.href },
    });
    navigation.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
});
