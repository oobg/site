import { Container } from '@components/layout/Container';
import { getPosts } from '@features/posts/services/posts.api';
import { LandingHero } from '@/app/_components/LandingHero';
import { LatestThinking } from '@/app/_components/LatestThinking';
import { SiteFooter } from '@/app/_components/SiteFooter';

export default async function HomePage() {
  const [latest] = await getPosts({ limit: 1, sort: '-published_at' });
  return (
    <Container>
      <main>
        <LandingHero />
        <LatestThinking post={latest ?? null} />
      </main>
      <SiteFooter />
    </Container>
  );
}
