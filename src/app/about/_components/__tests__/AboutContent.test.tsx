import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutContent } from '@/app/about/_components/AboutContent';

describe('AboutContent', () => {
  it('단일 h1 제목 "소개"를 렌더한다', () => {
    render(<AboutContent />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('소개');
  });

  it('소개 문단으로 시작한다', () => {
    render(<AboutContent />);
    expect(screen.getByText('프론트엔드 개발을 하고 있습니다.')).toBeInTheDocument();
  });

  it('섹션 제목을 원고 순서대로 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      '일하는 방식',
      '요즘 관심 있는 것',
      '다루는 기술',
      '이곳에 남기는 것',
    ]);
  });

  it('소제목을 원고 순서대로 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      '실제로 어떻게 쓰이는지부터 봅니다',
      '반복되는 판단은 규칙으로 남깁니다',
      'AI가 만든 결과도 그냥 믿지는 않습니다',
      '일단 만들어 보고, 필요하면 다시 설계합니다',
      '디자인 시스템',
      'AI와 일하는 구조',
      '에이전트 스킬',
    ]);
  });

  it('원고의 굵은 구간을 강조로 렌더한다', () => {
    render(<AboutContent />);
    expect(screen.getByText('판단').tagName).toBe('STRONG');
    expect(screen.getByText('검토할 재료를 빠르게 만들어 주는 도구').tagName).toBe('STRONG');
  });

  it('예전 소개 콘텐츠를 렌더하지 않는다', () => {
    render(<AboutContent />);
    for (const gone of [
      'About',
      'Better Interfaces',
      'AI & Systems',
      'Knowledge Infrastructure',
      '요즘 파고 있는 것',
      '무엇을 중요하게 보나',
      '사용자의 편의성',
      '성장성',
      '소통',
      '지금',
    ]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('개인 경력·연결 섹션을 렌더하지 않는다', () => {
    render(<AboutContent />);
    expect(screen.queryByText('지나온 곳')).not.toBeInTheDocument();
    expect(screen.queryByText('연결')).not.toBeInTheDocument();
  });
});
