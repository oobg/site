import { Container } from '@components/layout/Container';
import { Skeleton } from '@components/ui/Skeleton';
import projects from './projects.module.css';
import card from '@features/projects/components/ProjectCard.module.css';

const CARDS = 4;
const TITLE_WIDTHS = ['60%', '48%', '68%', '54%'];

export default function ProjectsLoading() {
  return (
    <Container>
      <div aria-busy aria-label="불러오는 중">
        <header className={projects.header}>
          <Skeleton width="8rem" height="var(--fs-40)" />
        </header>

        <div className={projects.grid}>
          {Array.from({ length: CARDS }).map((_, i) => (
            <div className={card.card} key={i}>
              <Skeleton className={card.cover} radius="0" height="auto" />
              <div className={card.body}>
                <Skeleton width={TITLE_WIDTHS[i]} height="var(--fs-20)" />
                <div className={card.summary}>
                  <Skeleton width="90%" height="var(--fs-15)" />
                </div>
                <div className={card.tags}>
                  <Skeleton width="3.5rem" height="var(--fs-13)" />
                  <Skeleton width="3rem" height="var(--fs-13)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
