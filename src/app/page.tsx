import { Container } from '@components/layout/Container';
import { getPosts } from '@features/posts/services/posts.api';
import { getProjects } from '@features/projects/services/projects.api';
import { LandingHero } from '@/app/_components/LandingHero';
import { RecentPosts } from '@/app/_components/RecentPosts';
import { LatestBuild } from '@/app/_components/LatestBuild';
import { Exploring } from '@/app/_components/Exploring';
import { Focus } from '@/app/_components/Focus';
import { Now } from '@/app/_components/Now';
import { Stack } from '@/app/_components/Stack';

/** 홈에 띄우는 최근 글 수. 늘어날수록 화면이 자연히 채워진다. */
const RECENT_POST_LIMIT = 5;

export default async function HomePage() {
  const [posts, [latestProject]] = await Promise.all([
    getPosts({ limit: RECENT_POST_LIMIT, sort: '-published_at' }),
    getProjects({ limit: 1, sort: '-published_at' }),
  ]);
  // 레이아웃이 이미 <main>으로 감싸므로 여기서 또 두지 않는다(랜드마크 중복).
  // 골격을 섹션마다 갈라 둔다: 히어로 → 행 목록 → 단건 → 번호 목록 → 3열 → 문단 → 칩.
  return (
    <Container>
      <LandingHero />
      <RecentPosts posts={posts} />
      <LatestBuild project={latestProject ?? null} />
      <Exploring />
      <Focus />
      <Now />
      <Stack />
    </Container>
  );
}
