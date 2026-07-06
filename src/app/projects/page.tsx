import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { ProjectCard } from '@features/projects/components/ProjectCard';
import { getProjects } from '@features/projects/services/projects.api';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import styles from './projects.module.css';

export const metadata: Metadata = buildMetadata({
  title: '프로젝트',
  description: '만들어 온 것들.',
  path: ROUTES.PROJECTS.LIST,
});

export default async function ProjectsListPage() {
  const projects = await getProjects({ sort: '-published_at' });

  return (
    <Container>
      <header className={styles.header}>
        <h1 className={styles.title}>프로젝트</h1>
      </header>
      {projects.length === 0 ? (
        <p className={styles.empty}>아직 프로젝트가 없어요.</p>
      ) : (
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </Container>
  );
}
