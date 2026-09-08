import { Container } from '@components/layout/Container';
import { Skeleton } from '@components/ui/Skeleton';
import blog from './blog.module.css';
import filter from './_components/TagFilter.module.css';
import row from '@features/posts/components/PostRow.module.css';

// 실제 PostRow와 정렬이 맞도록 자연스러운 폭 변화를 준다.
const ROWS = ['62%', '48%', '70%', '55%'];

export default function BlogLoading() {
  return (
    <Container>
      <div aria-busy aria-label="불러오는 중">
        <header className={blog.header}>
          <Skeleton width="5rem" height="var(--fs-56)" />
        </header>

        <nav className={filter.filter} aria-hidden>
          <Skeleton
            width="3rem"
            height="calc(var(--space-7) - var(--space-1))"
            radius="var(--radius-sm)"
          />
          <Skeleton
            width="5rem"
            height="calc(var(--space-7) - var(--space-1))"
            radius="var(--radius-sm)"
          />
          <Skeleton
            width="4rem"
            height="calc(var(--space-7) - var(--space-1))"
            radius="var(--radius-sm)"
          />
        </nav>

        {ROWS.map((titleWidth, i) => (
          <article className={row.row} key={i}>
            <div className={row.title}>
              <Skeleton width={titleWidth} height="var(--fs-30)" />
            </div>
            <div className={row.summary}>
              <Skeleton width="90%" height="var(--fs-15)" />
            </div>
            <div className={row.meta}>
              <Skeleton width="5rem" height="var(--fs-13)" />
              <Skeleton width="4rem" height="var(--fs-13)" />
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}
