# 프로젝트 목록 + 상세 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/projects` 카드 그리드 목록과 `/projects/[slug]` 헤더 메타 + 단일 칼럼 상세를 블로그 읽기 경험 패턴을 재사용해 구현한다.

**Architecture:** RSC-first. 서버 컴포넌트가 이미 존재하는 `features/projects/services`에서 직접 fetch. 목록은 `ProjectCard` 그리드, 상세는 `ProjectHeader`(고유 필드 role·period·stack·links) + 공용 `ArticleBody` + `ProjectNav`. 마크다운 렌더·정적 생성·NFC 디코딩은 블로그와 동일.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules + `:root` 토큰, Vitest + @testing-library/react.

## Global Constraints

- 패키지 매니저: **pnpm**. 테스트: `pnpm test` (vitest run).
- **raw hex/px 금지** — CSS는 `src/styles/tokens.css`의 CSS 변수 토큰만 참조. Tailwind 사용 안 함.
- **Barrel export 금지** — `index.ts`로 묶지 않고 실제 파일 직접 참조.
- 깊은 상대경로 금지 → path alias(`@features/*`, `@components/*`, `@lib/*`, `@constants/*`, `@/*`). 같은 폴더 `./`만 허용.
- 타입은 반드시 `import type`.
- 라우트 문자열 직접 작성 금지 → `ROUTES.*`만 사용.
- 서비스 파일은 `import 'server-only'` — 서버 컴포넌트에서만 호출.
- 역방향 import 금지: `components/**` → `@features/*`·`@/app/*` 불가.
- 모션: hover/transition은 `--dur`(200ms), 카드 hover `translateY(2px)`, `prefers-reduced-motion` 존중. accent 색은 interaction 전용.
- slug은 유니코드(한글) 허용. 상세 페이지에서 `decodeURIComponent(slug).normalize('NFC')` 필수.
- 커밋: Conventional Commits(자연어 한국어). 커밋 메시지 꼬리말에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **주의**: lint-staged/husky pre-commit이 prettier·eslint를 스테이징 파일에 자동 실행함. 커밋 전 로컬에서 통과 확인.

---

### Task 1: ArticleBody 공용 승격

블로그 page-local `ArticleBody`를 `components/content/`로 이동해 프로젝트 상세와 공유한다. 로직 변경 없이 위치만 이동 + 블로그 import 갱신.

**Files:**

- Create: `src/components/content/ArticleBody.tsx`
- Create: `src/components/content/ArticleBody.module.css`
- Delete: `src/app/blog/[slug]/_components/ArticleBody.tsx`
- Delete: `src/app/blog/[slug]/_components/ArticleBody.module.css`
- Modify: `src/app/blog/[slug]/page.tsx` (import 경로)

**Interfaces:**

- Produces: `ArticleBody({ html }: { html: string })` — `@components/content/ArticleBody`에서 export. `<div>` + `dangerouslySetInnerHTML`.

- [ ] **Step 1: 새 위치에 컴포넌트 생성**

`src/components/content/ArticleBody.tsx`:

```tsx
import styles from './ArticleBody.module.css';

export function ArticleBody({ html }: { html: string }) {
  return <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 2: CSS 이동 (내용 동일)**

`src/components/content/ArticleBody.module.css` — 기존 `src/app/blog/[slug]/_components/ArticleBody.module.css`의 내용을 그대로 복사:

```css
.prose {
  max-width: var(--w-reading);
  font-size: var(--font-body-size);
  line-height: var(--lh-body);
}
.prose :global(h2) {
  font-size: var(--fs-28);
  line-height: var(--lh-tight);
  margin-top: var(--space-8);
  margin-bottom: var(--space-4);
}
.prose :global(h3) {
  font-size: var(--fs-20);
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
}
.prose :global(p),
.prose :global(ul),
.prose :global(ol),
.prose :global(blockquote) {
  margin-block: var(--space-4);
}
.prose :global(ul),
.prose :global(ol) {
  padding-left: var(--space-5);
}
.prose :global(a) {
  color: var(--color-accent);
}
.prose :global(blockquote) {
  padding-left: var(--space-4);
  border-left: 2px solid var(--color-border);
  color: var(--color-text-secondary);
}
.prose :global(pre) {
  margin-block: var(--space-5);
  padding: var(--space-4);
  border-radius: var(--radius);
  overflow-x: auto;
  border: 1px solid var(--color-border);
  font-size: var(--fs-15);
}
.prose :global(code) {
  font-family: var(--font-mono), monospace;
}
.prose :global(img) {
  border-radius: var(--radius);
  margin-block: var(--space-5);
}
.prose :global(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin-block: var(--space-8);
}
```

- [ ] **Step 3: 블로그 상세 import 갱신**

`src/app/blog/[slug]/page.tsx`에서 이 줄을:

```tsx
import { ArticleBody } from '@/app/blog/[slug]/_components/ArticleBody';
```

다음으로 변경:

```tsx
import { ArticleBody } from '@components/content/ArticleBody';
```

- [ ] **Step 4: 옛 파일 삭제**

```bash
rm "src/app/blog/[slug]/_components/ArticleBody.tsx" "src/app/blog/[slug]/_components/ArticleBody.module.css"
```

- [ ] **Step 5: 타입체크·테스트·빌드 확인**

Run: `pnpm typecheck && pnpm test`
Expected: PASS (기존 블로그 테스트 그대로 통과, dangling import 없음)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(blog): ArticleBody를 components/content로 공용 승격

블로그·프로젝트 상세가 마크다운 본문을 공유하도록 page-local에서
components/content로 이동. 로직 변경 없음.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: ProjectCard 컴포넌트

목록 카드. cover(없으면 플레이스홀더) + title + summary + tag 칩. 전체 카드 링크.

**Files:**

- Create: `src/features/projects/components/ProjectCard.tsx`
- Create: `src/features/projects/components/ProjectCard.module.css`
- Test: `src/features/projects/components/__tests__/ProjectCard.test.tsx`

**Interfaces:**

- Consumes: `ProjectListItem` from `@features/projects/types/projects.types` (= `ContentListItem`: `slug, title, summary|null, tags[], published_at, updated_at, cover_image_url|null, reading_time_min?, status`). `ROUTES.PROJECTS.DETAIL(slug)`.
- Produces: `ProjectCard({ project }: { project: ProjectListItem })`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/projects/components/__tests__/ProjectCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@features/projects/components/ProjectCard';
import type { ProjectListItem } from '@features/projects/types/projects.types';

const base: ProjectListItem = {
  slug: 'raven-api',
  title: 'raven.kr 백엔드 API',
  summary: '멀티테넌트 NestJS API.',
  tags: ['backend'],
  published_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-07-05T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
};

describe('ProjectCard', () => {
  it('제목·요약·태그·상세 링크를 렌더한다', () => {
    render(<ProjectCard project={base} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
    expect(screen.getByText('멀티테넌트 NestJS API.')).toBeInTheDocument();
    expect(screen.getByText('#backend')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/raven-api');
  });

  it('cover가 있으면 img를, 없으면 img를 렌더하지 않는다', () => {
    const { rerender } = render(<ProjectCard project={base} />);
    expect(screen.queryByRole('img')).toBeNull();
    rerender(<ProjectCard project={{ ...base, cover_image_url: 'https://example.com/c.png' }} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/c.png');
  });

  it('summary가 null이어도 안전하게 렌더한다', () => {
    render(<ProjectCard project={{ ...base, summary: null }} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- src/features/projects/components/__tests__/ProjectCard.test.tsx`
Expected: FAIL — "Failed to resolve import ... ProjectCard" 또는 "ProjectCard is not defined"

- [ ] **Step 3: 컴포넌트 구현**

`src/features/projects/components/ProjectCard.tsx`:

```tsx
import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './ProjectCard.module.css';

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link href={ROUTES.PROJECTS.DETAIL(project.slug)} className={styles.card}>
      {project.cover_image_url ? (
        <img
          className={styles.cover}
          src={project.cover_image_url}
          alt={project.title}
          loading="lazy"
        />
      ) : (
        <div className={styles.coverPlaceholder} aria-hidden />
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>{project.title}</h2>
        {project.summary ? <p className={styles.summary}>{project.summary}</p> : null}
        {project.tags.length > 0 ? (
          <div className={styles.tags}>
            {project.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: CSS 작성**

`src/features/projects/components/ProjectCard.module.css`:

```css
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--color-surface);
  color: inherit;
  transition:
    transform var(--dur) ease,
    border-color var(--dur) ease;
}
.card:hover {
  transform: translateY(2px);
  border-color: var(--color-accent);
}
.cover,
.coverPlaceholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}
.coverPlaceholder {
  background: var(--color-canvas);
  border-bottom: 1px solid var(--color-border);
}
.body {
  padding: var(--space-5);
}
.title {
  font-size: var(--fs-20);
  line-height: var(--lh-tight);
}
.summary {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--fs-15);
}
.tags {
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-3);
  font-size: var(--fs-13);
  color: var(--color-text-muted);
  font-family: var(--font-mono), monospace;
}
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card:hover {
    transform: none;
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test -- src/features/projects/components/__tests__/ProjectCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/features/projects/components/
git commit -m "feat(projects): ProjectCard 컴포넌트 추가

cover(없으면 플레이스홀더)·제목·요약·태그 칩을 담은 목록 카드.
전체 카드가 상세 링크. hover translateY 모션·reduced-motion 존중.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 프로젝트 목록 페이지 `/projects`

**Files:**

- Create: `src/app/projects/page.tsx`
- Create: `src/app/projects/projects.module.css`

**Interfaces:**

- Consumes: `getProjects` from `@features/projects/services/projects.api` (`(params?: ListParams) => Promise<ContentListItem[]>`), `ProjectCard`, `Container` from `@components/layout/Container`, `buildMetadata` from `@lib/metadata/metadata`, `ROUTES`.

- [ ] **Step 1: 페이지 작성**

`src/app/projects/page.tsx`:

```tsx
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
```

- [ ] **Step 2: CSS 작성**

`src/app/projects/projects.module.css`:

```css
.header {
  padding-top: var(--space-9);
  margin-bottom: var(--space-7);
}
.title {
  font-size: var(--fs-40);
  line-height: var(--lh-tight);
}
.empty {
  color: var(--color-text-muted);
  padding-block: var(--space-8);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6);
}
@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 타입체크·빌드 확인**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm build`
Expected: `/projects` 라우트가 정적으로 생성됨(빌드 성공). mock 데이터(`CONTENT_SOURCE` 기본 mock)로 1개 카드 렌더.

- [ ] **Step 4: Commit**

```bash
git add src/app/projects/page.tsx src/app/projects/projects.module.css
git commit -m "feat(projects): 프로젝트 목록 페이지(/projects) 추가

ProjectCard 2열 그리드. getProjects 서버 fetch, 빈 상태 처리.
모바일 1열 폴백.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: ProjectHeader 컴포넌트

상세 상단. title + 메타(날짜·role·period·stack 칩·links). 고유 필드는 `frontmatter`에서, 모두 optional → 조건부 렌더.

**Files:**

- Create: `src/app/projects/[slug]/_components/ProjectHeader.tsx`
- Create: `src/app/projects/[slug]/_components/ProjectHeader.module.css`
- Test: `src/app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx`

**Interfaces:**

- Consumes: `Project` from `@features/projects/types/projects.types` (= `ContentDetail`: 목록 필드 + `body_markdown`, `frontmatter: Record<string, unknown>`), `ProjectFrontmatter` (`{ role?, period?, stack?: string[], links?: { repo?, live? } }`) from 같은 파일.
- Produces: `ProjectHeader({ project }: { project: Project })`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectHeader } from '@/app/projects/[slug]/_components/ProjectHeader';
import type { Project } from '@features/projects/types/projects.types';

const base: Project = {
  slug: 'raven-api',
  title: 'raven.kr 백엔드 API',
  summary: '멀티테넌트 NestJS API.',
  tags: ['backend'],
  published_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-07-05T00:00:00.000Z',
  cover_image_url: null,
  status: 'published',
  body_markdown: '본문',
  frontmatter: {
    role: '1인 개발',
    period: '2026-06 ~ 진행중',
    stack: ['TypeScript', 'NestJS'],
    links: { repo: 'https://github.com/oobg/api', live: 'https://api.raven.kr' },
  },
};

describe('ProjectHeader', () => {
  it('제목과 고유 필드(role·period·stack·links)를 렌더한다', () => {
    render(<ProjectHeader project={base} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(base.title);
    expect(screen.getByText('1인 개발')).toBeInTheDocument();
    expect(screen.getByText('2026-06 ~ 진행중')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /repo/i })).toHaveAttribute(
      'href',
      'https://github.com/oobg/api',
    );
    expect(screen.getByRole('link', { name: /live/i })).toHaveAttribute(
      'href',
      'https://api.raven.kr',
    );
  });

  it('frontmatter가 비면 고유 필드·링크를 생략한다', () => {
    render(<ProjectHeader project={{ ...base, frontmatter: {} }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(base.title);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText('1인 개발')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test -- src/app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx`
Expected: FAIL — import 해석 실패

- [ ] **Step 3: 컴포넌트 구현**

`src/app/projects/[slug]/_components/ProjectHeader.tsx`:

```tsx
import type { Project, ProjectFrontmatter } from '@features/projects/types/projects.types';
import styles from './ProjectHeader.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function ProjectHeader({ project }: { project: Project }) {
  const fm = project.frontmatter as ProjectFrontmatter;
  const stack = fm.stack ?? [];
  const repo = fm.links?.repo;
  const live = fm.links?.live;

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{project.title}</h1>
      <dl className={styles.meta}>
        <div className={styles.row}>
          <dt className={styles.label}>Date</dt>
          <dd>
            <time dateTime={project.published_at}>{formatDate(project.published_at)}</time>
          </dd>
        </div>
        {fm.role ? (
          <div className={styles.row}>
            <dt className={styles.label}>Role</dt>
            <dd>{fm.role}</dd>
          </div>
        ) : null}
        {fm.period ? (
          <div className={styles.row}>
            <dt className={styles.label}>Period</dt>
            <dd>{fm.period}</dd>
          </div>
        ) : null}
        {stack.length > 0 ? (
          <div className={styles.row}>
            <dt className={styles.label}>Stack</dt>
            <dd className={styles.stack}>
              {stack.map((s) => (
                <span key={s} className={styles.chip}>
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {repo || live ? (
          <div className={styles.row}>
            <dt className={styles.label}>Links</dt>
            <dd className={styles.links}>
              {repo ? (
                <a href={repo} target="_blank" rel="noreferrer">
                  Repo
                </a>
              ) : null}
              {live ? (
                <a href={live} target="_blank" rel="noreferrer">
                  Live
                </a>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}
```

- [ ] **Step 4: CSS 작성**

`src/app/projects/[slug]/_components/ProjectHeader.module.css`:

```css
.header {
  padding-top: var(--space-9);
  margin-bottom: var(--space-7);
  max-width: var(--w-reading);
}
.title {
  font-size: var(--fs-40);
  line-height: var(--lh-tight);
}
.meta {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-5);
}
.row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: var(--space-4);
  font-size: var(--fs-15);
}
.label {
  color: var(--color-text-muted);
  font-size: var(--fs-13);
  font-family: var(--font-mono), monospace;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.chip {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-13);
  font-family: var(--font-mono), monospace;
}
.links {
  display: flex;
  gap: var(--space-4);
}
.links a {
  color: var(--color-accent);
  transition: color var(--dur) ease;
}
.links a:hover {
  color: var(--color-accent-hover);
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test -- src/app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add "src/app/projects/[slug]/_components/ProjectHeader.tsx" "src/app/projects/[slug]/_components/ProjectHeader.module.css" "src/app/projects/[slug]/_components/__tests__/ProjectHeader.test.tsx"
git commit -m "feat(projects): ProjectHeader 컴포넌트 추가

제목 + 고유 필드 메타(role·period·stack 칩·repo/live 링크).
frontmatter를 ProjectFrontmatter로 소비, 누락 필드 조건부 생략.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: ProjectNav 컴포넌트

이전/다음 프로젝트 네비. `PostNav` 구조 미러링, `ROUTES.PROJECTS.DETAIL`·라벨만 다름.

**Files:**

- Create: `src/app/projects/[slug]/_components/ProjectNav.tsx`
- Create: `src/app/projects/[slug]/_components/ProjectNav.module.css`

**Interfaces:**

- Consumes: `ProjectListItem` from `@features/projects/types/projects.types`, `ROUTES.PROJECTS.DETAIL`.
- Produces: `ProjectNav({ prev, next }: { prev: ProjectListItem | null; next: ProjectListItem | null })`.

- [ ] **Step 1: 컴포넌트 작성**

`src/app/projects/[slug]/_components/ProjectNav.tsx`:

```tsx
import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './ProjectNav.module.css';

export function ProjectNav({
  prev,
  next,
}: {
  prev: ProjectListItem | null;
  next: ProjectListItem | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav className={styles.nav}>
      {prev ? (
        <Link href={ROUTES.PROJECTS.DETAIL(prev.slug)}>
          <span className={styles.label}>이전 프로젝트</span>
          {prev.title}
        </Link>
      ) : null}
      {next ? (
        <Link className={styles.next} href={ROUTES.PROJECTS.DETAIL(next.slug)}>
          <span className={styles.label}>다음 프로젝트</span>
          {next.title}
        </Link>
      ) : null}
    </nav>
  );
}
```

- [ ] **Step 2: CSS 작성 (PostNav.module.css 동일 스타일)**

`src/app/projects/[slug]/_components/ProjectNav.module.css`:

```css
.nav {
  display: flex;
  justify-content: space-between;
  gap: var(--space-5);
  margin-top: var(--section-gap);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
  font-size: var(--fs-15);
}
.label {
  display: block;
  font-size: var(--fs-13);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
.next {
  margin-left: auto;
  text-align: right;
}
```

- [ ] **Step 3: 타입체크 확인**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "src/app/projects/[slug]/_components/ProjectNav.tsx" "src/app/projects/[slug]/_components/ProjectNav.module.css"
git commit -m "feat(projects): ProjectNav 컴포넌트 추가

이전/다음 프로젝트 네비. PostNav 구조 미러링, ROUTES.PROJECTS 사용.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 프로젝트 상세 페이지 `/projects/[slug]`

정적 생성 + NFC 디코딩 + 마크다운 렌더 + ProjectHeader/ArticleBody/ProjectNav 조립.

**Files:**

- Create: `src/app/projects/[slug]/page.tsx`
- Create: `src/app/projects/[slug]/project.module.css`

**Interfaces:**

- Consumes: `getProject` (`(slug: string) => Promise<Project>`), `getProjects` (`(params?) => Promise<ContentListItem[]>`) from `@features/projects/services/projects.api`; `renderMarkdown` (`(md: string) => Promise<{ html: string; toc: ... }>`) from `@lib/markdown/render`; `buildMetadata`; `ROUTES`; `ProjectHeader`, `ProjectNav`, `ArticleBody`(`@components/content/ArticleBody`), `Container`.

- [ ] **Step 1: 페이지 작성**

`src/app/projects/[slug]/page.tsx`:

```tsx
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
```

- [ ] **Step 2: CSS 작성**

`src/app/projects/[slug]/project.module.css`:

```css
.article {
  max-width: var(--w-reading);
}
```

- [ ] **Step 3: 타입체크·테스트·빌드 확인**

Run: `pnpm typecheck && pnpm test`
Expected: PASS (전체 스위트)

Run: `pnpm build`
Expected: 빌드 성공. `/projects/raven-api`가 mock 데이터로 정적 생성. `generateStaticParams`가 slug 목록 반환.

- [ ] **Step 4: Commit**

```bash
git add "src/app/projects/[slug]/page.tsx" "src/app/projects/[slug]/project.module.css"
git commit -m "feat(projects): 프로젝트 상세 페이지(/projects/[slug]) 조립

정적 생성 + NFC slug 디코딩 + renderMarkdown. ProjectHeader·ArticleBody·
ProjectNav 단일 칼럼 조립. prev/next는 정렬 목록에서 계산.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- 카드 그리드 목록 → Task 2, 3 ✅
- 헤더 메타(role·period·stack·links) + 단일 칼럼 → Task 4, 6 ✅
- 이전/다음 네비 → Task 5, 6 ✅
- ArticleBody 공용 승격 → Task 1 ✅
- 서비스 계층 재사용(변경 없음) → 전 태스크 consume, 신규 파일 없음 ✅
- NFC 디코딩·정적 생성 → Task 6 ✅
- 목록 카드는 tags(frontmatter 없음) → Task 2 (ProjectCard가 ProjectListItem만 소비) ✅
- reading time 미표시 → Task 4 (ProjectHeader에 reading time 없음) ✅
- cover 플레이스홀더 → Task 2 ✅
- 태그 필터 없음 → Task 3 (TagFilter 미포함) ✅

**Placeholder scan:** 모든 스텝에 실제 코드·명령·예상 출력 포함. TBD/TODO 없음. ✅

**Type consistency:**

- `ProjectListItem`/`Project`는 기존 `projects.types.ts`에서 그대로 소비 — 정의 일관.
- `ProjectFrontmatter` 필드명(`role`, `period`, `stack`, `links.repo`, `links.live`) Task 4에서 일관 사용.
- `getProjects`/`getProject` 시그니처 Task 3·6 일치.
- `ArticleBody({ html })` Task 1 정의 ↔ Task 6 소비 일치.
- `renderMarkdown`은 `{ html, toc }` 반환 — Task 6에서 `html`만 구조분해(toc 미사용, 상세 단일 칼럼 설계와 일치). ✅

## 스코프 밖 (이 계획에 없음)

- 글로벌 네비/헤더에 `/projects` 링크 노출.
- 홈 랜딩에 프로젝트 섹션.
- 목록 태그 필터·페이지네이션.
- next/image 최적화(remotePatterns).
