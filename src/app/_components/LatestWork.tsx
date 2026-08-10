import type { PostListItem } from '@features/posts/types/posts.types';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { LatestThinking } from './LatestThinking';
import { LatestBuild } from './LatestBuild';
import styles from './LatestWork.module.css';

/* 최근 글과 최근 프로젝트를 한 섹션 2열로 나란히 둔다.
   전에는 각자 한 섹션을 차지하며 좌우 2열을 이뤘는데, 커버 이미지가 없으면
   미디어 열이 사라져 두 섹션 모두 1열로 무너지고 화면 오른쪽이 통째로 비었다.
   글과 프로젝트를 서로의 짝으로 세우면 커버 유무와 무관하게 두 열이 찬다.

   블록은 스스로 생존을 판단한다 — 둘 다 없으면 섹션 자체가 렌더되지 않고,
   하나만 있으면 그 하나가 전폭을 쓴다(빈 열을 남기지 않는다). */
export function LatestWork({
  post,
  project,
}: {
  post: PostListItem | null;
  project: ProjectListItem | null;
}) {
  if (!post && !project) return null;
  const single = !post || !project;
  return (
    <section className={styles.section}>
      <div className={single ? `${styles.grid} ${styles.single}` : styles.grid}>
        <LatestThinking post={post} />
        <LatestBuild project={project} />
      </div>
    </section>
  );
}
