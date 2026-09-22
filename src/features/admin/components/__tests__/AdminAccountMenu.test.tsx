import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAccountMenu } from '@features/admin/components/AdminAccountMenu';

const { signOutAction } = vi.hoisted(() => ({ signOutAction: vi.fn() }));
vi.mock('@features/admin/services/auth.actions', () => ({ signOutAction }));

describe('AdminAccountMenu', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['Enter', ' '])('%s의 native click으로 열면 menuitem에 focus한다', async (key) => {
    render(<AdminAccountMenu userEmail="owner@example.test" />);
    const trigger = screen.getByRole('button', { name: '계정 메뉴' });

    trigger.focus();
    fireEvent.keyDown(trigger, { key });
    fireEvent.keyUp(trigger, { key });
    fireEvent.click(trigger, { detail: 0 });

    await waitFor(() => expect(screen.getByRole('menuitem', { name: '로그아웃' })).toHaveFocus());
  });

  it('pointer로 열고 바깥을 누르면 닫는다', () => {
    render(<AdminAccountMenu userEmail="owner@example.test" />);
    const trigger = screen.getByRole('button', { name: '계정 메뉴' });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toHaveTextContent('owner@example.test');
    const signOut = screen.getByRole('menuitem', { name: '로그아웃' });
    expect(signOut).toHaveAttribute('type', 'submit');
    fireEvent.submit(signOut.closest('form') as HTMLFormElement);
    expect(signOutAction).toHaveBeenCalledOnce();

    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ArrowDown으로 열어 menuitem에 focus하고 Escape로 trigger에 focus를 돌린다', async () => {
    render(<AdminAccountMenu userEmail="owner@example.test" />);
    const trigger = screen.getByRole('button', { name: '계정 메뉴' });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const signOut = screen.getByRole('menuitem', { name: '로그아웃' });
    await waitFor(() => expect(signOut).toHaveFocus());

    fireEvent.keyDown(signOut, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('이미 열린 메뉴에서도 trigger의 ArrowDown으로 menuitem에 focus한다', async () => {
    render(<AdminAccountMenu userEmail="owner@example.test" />);
    const trigger = screen.getByRole('button', { name: '계정 메뉴' });

    fireEvent.click(trigger);
    const signOut = screen.getByRole('menuitem', { name: '로그아웃' });
    await waitFor(() => expect(signOut).toHaveFocus());

    trigger.focus();
    expect(trigger).toHaveFocus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    expect(signOut).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('Tab으로 container를 벗어나면 다음 요소의 focus를 유지하며 닫는다', async () => {
    render(
      <>
        <AdminAccountMenu userEmail="owner@example.test" />
        <button type="button">다음</button>
      </>,
    );
    const trigger = screen.getByRole('button', { name: '계정 메뉴' });

    fireEvent.click(trigger);
    const signOut = screen.getByRole('menuitem', { name: '로그아웃' });
    await waitFor(() => expect(signOut).toHaveFocus());

    fireEvent.keyDown(signOut, { key: 'Tab' });
    const next = screen.getByRole('button', { name: '다음' });
    next.focus();

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(next).toHaveFocus();
  });

  it('trigger를 다시 누르면 열린 메뉴를 닫는다', async () => {
    render(<AdminAccountMenu userEmail="owner@example.test" />);
    const trigger = screen.getByRole('button', { name: '계정 메뉴' });

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '로그아웃' })).toHaveFocus());
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
