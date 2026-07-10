import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutTeaser } from '@/app/_components/AboutTeaser';

describe('AboutTeaser', () => {
  it('About 페이지로 가는 링크를 렌더한다', () => {
    render(<AboutTeaser />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/about');
  });
});
