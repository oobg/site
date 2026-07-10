import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { AboutContent } from '@/app/about/_components/AboutContent';

export const metadata: Metadata = buildMetadata({
  title: 'About',
  description: '생각을 시스템과 제품으로 옮기는 과정을 기록하는 사람.',
  path: ROUTES.ABOUT,
});

export default function AboutPage() {
  return (
    <Container>
      <AboutContent />
    </Container>
  );
}
