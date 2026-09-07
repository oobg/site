import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutContent } from '@/app/about/_components/AboutContent';

describe('AboutContent', () => {
  it('단일 h1 제목을 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('사이트 소개를 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getByText(/raven\.kr은/)).toBeInTheDocument();
  });

  it('개인 경력 섹션을 렌더하지 않는다', () => {
    render(<AboutContent />);
    expect(screen.queryByText('지나온 곳')).not.toBeInTheDocument();
  });

  it('개인 연결 링크를 렌더하지 않는다', () => {
    render(<AboutContent />);
    expect(screen.queryByText('연결')).not.toBeInTheDocument();
  });
});
