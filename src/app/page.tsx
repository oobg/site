import { Container } from '@components/layout/Container';
import { getPosts } from '@features/posts/services/posts.api';
import { getProjects } from '@features/projects/services/projects.api';
import { LandingHero } from '@/app/_components/LandingHero';
import { LatestThinking } from '@/app/_components/LatestThinking';
import { LatestBuild } from '@/app/_components/LatestBuild';
import { Exploring } from '@/app/_components/Exploring';
import { AboutTeaser } from '@/app/_components/AboutTeaser';

export default async function HomePage() {
  const [[latestPost], [latestProject]] = await Promise.all([
    getPosts({ limit: 1, sort: '-published_at' }),
    getProjects({ limit: 1, sort: '-published_at' }),
  ]);
  return (
    <Container>
      <main>
        <LandingHero />
        <LatestThinking post={latestPost ?? null} />
        <LatestBuild project={latestProject ?? null} />
        <Exploring />
        <AboutTeaser />
      </main>
    </Container>
  );
}
