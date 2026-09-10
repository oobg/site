import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@features/admin/components/AdminFrame', () => ({
  AdminFrame: ({ children, description }: { children: React.ReactNode; description: string }) => (
    <main>
      <p>{description}</p>
      {children}
    </main>
  ),
}));
import AdminError from '@/app/admin/error';

describe('AdminError', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));

  it('조회 오류를 로그인 실패로 단정하지 않고 다시 시도할 수 있게 한다', () => {
    const reset = vi.fn();
    render(
      <AdminError
        error={Object.assign(new Error('private'), { digest: 'digest' })}
        reset={reset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByText(/글 관리 화면을 불러오는 중/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument();
  });
});
