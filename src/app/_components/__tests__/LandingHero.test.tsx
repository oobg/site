import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHero } from '@/app/_components/LandingHero';

describe('LandingHero', () => {
  it('헤드라인과 보조문을 렌더한다', () => {
    render(<LandingHero />);
    expect(
      screen.getByRole('heading', { name: 'Ideas deserve good interfaces.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.'),
    ).toBeInTheDocument();
  });
});
