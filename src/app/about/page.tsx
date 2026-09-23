import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { AboutContent } from '@/app/about/_components/AboutContent';

export const metadata: Metadata = buildMetadata({
  title: '소개',
  description:
    '프론트엔드 개발을 하고 있습니다. 화면을 만드는 일을 좋아하지만, 화면만 잘 만드는 것으로는 충분하지 않다고 생각합니다.',
  path: ROUTES.ABOUT,
});

export default function AboutPage() {
  return (
    <Container>
      <AboutContent />
    </Container>
  );
}
