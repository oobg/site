import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { getProject, getProjects } from '@features/projects/services/projects.api';
import { renderMarkdown } from '@lib/markdown/render';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { ArticleBody } from '@components/content/ArticleBody';
import { ProjectHeader } from '@/app/projects/[slug]/_components/ProjectHeader';
import { ProjectNav } from '@/app/projects/[slug]/_components/ProjectNav';
import styles from './project.module.css';

export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = decodeURIComponent(slug).normalize('NFC');
  const project = await getProject(key);
  return buildMetadata({
    title: project.title,
    description: project.summary ?? undefined,
    path: ROUTES.PROJECTS.DETAIL(project.slug),
  });
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = decodeURIComponent(slug).normalize('NFC');
  const project = await getProject(key);
  const { html } = await renderMarkdown(project.body_markdown);

  const all = await getProjects({ sort: '-published_at' });
  const index = all.findIndex((p) => p.slug === project.slug);
  const next = index > 0 ? all[index - 1] : null;
  const prev = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <Container>
      <article className={styles.article}>
        <ProjectHeader project={project} />
        <ArticleBody html={html} />
        <ProjectNav prev={prev} next={next} />
      </article>
    </Container>
  );
}
