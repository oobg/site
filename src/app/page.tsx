import { Container } from '@components/layout/Container';
import { getPosts } from '@features/posts/services/posts.api';
import { getProjects } from '@features/projects/services/projects.api';
import { LandingHero } from '@/app/_components/LandingHero';
import { RecentPosts } from '@/app/_components/RecentPosts';
import { LatestBuild } from '@/app/_components/LatestBuild';
import { Now } from '@/app/_components/Now';

/** 홈에 띄우는 최근 글 수. 늘어날수록 화면이 자연히 채워진다. */
const RECENT_POST_LIMIT = 5;

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [posts, [latestProject]] = await Promise.all([
    getPosts({ limit: RECENT_POST_LIMIT, sort: '-published_at' }),
    getProjects({ limit: 1, sort: '-published_at' }),
  ]);
  // 레이아웃이 이미 <main>으로 감싸므로 여기서 또 두지 않는다(랜드마크 중복).
  //
  // 세 구간이 프레임을 공유하지 않는다 — 조밀한 행 목록 / 지면을 직접 쓰는 단건 /
  // 문단 하나. 구분도 여백과 선을 나눠 쓴다. 같은 틀에 넣으면 위계가 아니라
  // 평평한 목록으로 읽힌다.
  //
  // '요즘 파고 있는 것'·'어떻게 일하나'·'주로 쓰는 것'은 전부 자기소개라 About이
  // 정본이다. 랜딩이 그걸 복사해 화면을 채우고 있었다.
  return (
    <Container>
      <LandingHero />
      <RecentPosts posts={posts} />
      <LatestBuild project={latestProject ?? null} />
      <Now />
    </Container>
  );
}
