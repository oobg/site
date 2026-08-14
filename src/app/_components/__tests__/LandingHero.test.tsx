import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHero } from '@/app/_components/LandingHero';

describe('LandingHero', () => {
  it('헤드라인과 보조문을 렌더한다', () => {
    render(<LandingHero />);
    expect(
      screen.getByRole('heading', { name: '서버부터 화면까지 혼자 만듭니다.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('만들면서 남은 기록을 여기 둡니다.')).toBeInTheDocument();
  });

  it('브랜드 마크를 이미지 역할로 노출한다', () => {
    render(<LandingHero />);
    expect(screen.getByRole('img', { name: 'raven.kr 심볼' })).toBeInTheDocument();
  });
});
