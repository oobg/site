import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutContent } from '@/app/about/_components/AboutContent';

describe('AboutContent', () => {
  it('단일 h1 제목을 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('GitHub 연결 링크를 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/oobg',
    );
  });
});
