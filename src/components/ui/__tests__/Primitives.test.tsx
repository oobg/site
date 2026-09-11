import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CategoryTabs } from '@components/ui/CategoryTabs';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';

describe('Day0 UI primitives', () => {
  it('connects an input label, description, and error', () => {
    render(
      <Input label="제목" description="글에 표시되는 제목이에요." error="제목을 입력해 주세요." />,
    );
    const input = screen.getByRole('textbox', { name: '제목' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('글에 표시되는 제목이에요. 제목을 입력해 주세요.');
  });

  it('moves category tab focus and selection with the keyboard', async () => {
    const onValueChange = vi.fn();
    render(
      <CategoryTabs
        categories={[
          { id: 'all', name: '전체' },
          { id: 'dev', name: '개발' },
        ]}
        value="all"
        onValueChange={onValueChange}
      >
        <p>글 목록</p>
      </CategoryTabs>,
    );
    const all = screen.getByRole('tab', { name: '전체' });
    all.focus();
    fireEvent.keyDown(all, { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 });
    fireEvent.keyUp(all, { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 });
    const development = screen.getByRole('tab', { name: '개발' });
    await waitFor(() => expect(development).toHaveFocus());
    expect(screen.getByRole('tabpanel')).toHaveTextContent('글 목록');
  });

  it('closes a modal dialog with Escape and restores focus', async () => {
    render(
      <Dialog trigger="편집" title="글 편집">
        <button>저장</button>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: '편집' });
    fireEvent.click(trigger);
    expect(await screen.findByRole('dialog', { name: '글 편집' })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('gives a select an accessible label and supports keyboard selection', async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        label="대표 카테고리"
        options={[{ value: 'dev', label: '개발' }]}
        onValueChange={onValueChange}
      />,
    );
    const select = screen.getByRole('combobox', { name: '대표 카테고리' });
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.keyDown(await screen.findByRole('option', { name: '개발' }), { key: 'Enter' });
    await waitFor(() => expect(onValueChange).toHaveBeenCalled());
    expect(onValueChange.mock.calls[0]?.[0]).toBe('dev');
  });
});
