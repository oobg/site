import { Container } from '@components/layout/Container';
import { getPosts } from '@features/posts/services/posts.api';
import { getProjects } from '@features/projects/services/projects.api';
import { LandingHero } from '@/app/_components/LandingHero';
import { LatestWork } from '@/app/_components/LatestWork';
import { Exploring } from '@/app/_components/Exploring';
import { Now } from '@/app/_components/Now';
import { Stack } from '@/app/_components/Stack';

export default async function HomePage() {
  const [[latestPost], [latestProject]] = await Promise.all([
    getPosts({ limit: 1, sort: '-published_at' }),
    getProjects({ limit: 1, sort: '-published_at' }),
  ]);
  // 레이아웃이 이미 <main>으로 감싸므로 여기서 또 두지 않는다(랜드마크 중복).
  return (
    <Container>
      <LandingHero />
      <LatestWork post={latestPost ?? null} project={latestProject ?? null} />
      <Exploring />
      <Now />
      <Stack />
    </Container>
  );
}
