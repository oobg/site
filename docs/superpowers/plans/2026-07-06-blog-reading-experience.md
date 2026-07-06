# 블로그 읽기 경험 (목록 + 상세) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 블로그 목록(/blog)과 상세(/blog/[slug]) 읽기 경험을 만든다 — 서버 마크다운 렌더링(shiki), 활성 TOC, RSC 태그 필터, 한글 유니코드 slug.

**Architecture:** RSC-first. 상세는 서버에서 `unified`로 마크다운→HTML(코드는 shiki, 클라 JS 0), TOC만 클라이언트 컴포넌트. 목록은 `?tag=` searchParams 서버 필터. slug은 NFC 정규화된 유니코드 문자열.

**Tech Stack:** Next.js 16 App Router, React 19, unified/remark/rehype, @shikijs/rehype, CSS Modules, Vitest.

## Global Constraints

- pnpm; Conventional Commits (자연어 한국어 subject/body, 영문 type/scope). commitlint body 라인 ≤100자.
- no-barrel, path alias, `import type`. CSS 변수 토큰만(raw hex/px 금지), Tailwind 금지.
- RSC-first: 정적 읽기는 서버 fetch/렌더. 클라이언트 컴포넌트는 상호작용(TOC 하이라이트)에만.
- 마크다운 렌더는 `src/lib/markdown/render.ts`(`import 'server-only'`). shiki 라이트 테마 `github-light`.
- slug: 유니코드(한글) 허용, **조회 전 `.normalize('NFC')`**. 계약 `docs/api-contract/content-v2.md`.
- 데이터 계층 재사용: `getPosts(params)`, `getPost(slug)` (features/posts/services/posts.api). `summary`는 `string | null`.
- ROUTES.BLOG.LIST='/blog', ROUTES.BLOG.DETAIL(slug). 라우트 문자열 직접 작성 금지.
- 타입: `Post = ContentDetail`, `PostListItem = ContentListItem` (features/posts/types/posts.types).

---

### Task 1: 마크다운 렌더 라이브러리 (renderMarkdown + TOC)

**Files:**

- Create: `src/lib/markdown/toc.types.ts`, `src/lib/markdown/render.ts`
- Test: `src/lib/markdown/__tests__/render.test.ts`

**Interfaces:**

- Produces:
  - `interface TocEntry { id: string; text: string; depth: 2 | 3 }` (toc.types.ts)
  - `renderMarkdown(md: string): Promise<{ html: string; toc: TocEntry[] }>` (render.ts, server-only)

- [ ] **Step 1: 의존성 설치**

```bash
cd /Users/forspacelab/private/01_project/site
pnpm add unified remark-parse remark-gfm remark-rehype rehype-slug rehype-stringify @shikijs/rehype unist-util-visit
pnpm add -D @types/hast @types/mdast
```

- [ ] **Step 2: `toc.types.ts` 작성**

```ts
export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}
```

- [ ] **Step 3: 실패하는 테스트 작성 (`src/lib/markdown/__tests__/render.test.ts`)**

````ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@lib/markdown/render';

describe('renderMarkdown', () => {
  it('헤딩에 id를 부여하고 toc를 추출한다', async () => {
    const md = '## 왜 헥사고날인가\n\n본문.\n\n### 포트와 어댑터\n\n내용.';
    const { html, toc } = await renderMarkdown(md);
    expect(html).toContain('<h2 id="왜-헥사고날인가"');
    expect(toc).toEqual([
      { id: '왜-헥사고날인가', text: '왜 헥사고날인가', depth: 2 },
      { id: '포트와-어댑터', text: '포트와 어댑터', depth: 3 },
    ]);
  });

  it('코드펜스를 shiki로 하이라이트한다', async () => {
    const md = '```ts\nconst x = 1;\n```';
    const { html } = await renderMarkdown(md);
    expect(html).toContain('<pre');
    expect(html).toContain('shiki');
    expect(html).toContain('github-light');
  });

  it('h1/h4는 toc에 넣지 않는다', async () => {
    const { toc } = await renderMarkdown('# 제목\n\n#### 작은제목');
    expect(toc).toEqual([]);
  });
});
````

- [ ] **Step 4: 테스트 실패 확인**

Run: `pnpm test src/lib/markdown`
Expected: FAIL — `@lib/markdown/render` 모듈 없음.

- [ ] **Step 5: `render.ts` 구현**

```ts
import 'server-only';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { TocEntry } from '@lib/markdown/toc.types';

// 구조적 타입으로 텍스트만 추출(hast 세부 타입 마찰 회피)
type TextishNode = { type: string; value?: string; children?: TextishNode[] };
function nodeText(node: TextishNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map((child) => nodeText(child)).join('');
}

function collectToc(toc: TocEntry[]) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const depth = node.tagName === 'h2' ? 2 : node.tagName === 'h3' ? 3 : 0;
      if (depth === 0) return;
      const id = node.properties?.id;
      if (typeof id !== 'string') return;
      toc.push({
        id,
        text: nodeText(node as unknown as TextishNode).trim(),
        depth: depth as 2 | 3,
      });
    });
  };
}

export async function renderMarkdown(md: string): Promise<{ html: string; toc: TocEntry[] }> {
  const toc: TocEntry[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(collectToc, toc)
    .use(rehypeShiki, { theme: 'github-light' })
    .use(rehypeStringify)
    .process(md);
  return { html: String(file), toc };
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm test src/lib/markdown`
Expected: 3 passed. (shiki 첫 실행 시 다소 느릴 수 있음.)

- [ ] **Step 7: 타입·lint 확인 후 커밋**

Run: `pnpm typecheck && pnpm lint`

```bash
git add -A
git commit -m "feat: unified 기반 마크다운 렌더(shiki)·TOC 추출 추가"
```

---

### Task 2: 읽기 시간 유틸 + metadata OG 병합

**Files:**

- Create: `src/lib/markdown/reading-time.ts`, `src/lib/markdown/__tests__/reading-time.test.ts`
- Modify: `src/lib/metadata/metadata.ts`
- Test: `src/lib/metadata/__tests__/metadata.test.ts`

**Interfaces:**

- Produces: `computeReadingTime(md: string): number` (분, 최소 1). `buildMetadata`는 base OG 병합.
- Consumes: `baseMetadata`, `buildMetadata` (기존 metadata.ts).

- [ ] **Step 1: reading-time 실패 테스트**

```ts
import { describe, it, expect } from 'vitest';
import { computeReadingTime } from '@lib/markdown/reading-time';

describe('computeReadingTime', () => {
  it('단어 수를 분으로 환산한다(200 wpm, 반올림)', () => {
    const md = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(computeReadingTime(md)).toBe(2);
  });
  it('짧은 글도 최소 1분', () => {
    expect(computeReadingTime('짧은 글')).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/lib/markdown/__tests__/reading-time.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: reading-time 구현**

```ts
export function computeReadingTime(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/lib/markdown/__tests__/reading-time.test.ts`
Expected: 2 passed.

- [ ] **Step 5: metadata 병합 실패 테스트**

```ts
import { describe, it, expect } from 'vitest';
import { buildMetadata } from '@lib/metadata/metadata';

describe('buildMetadata', () => {
  it('base openGraph(siteName·type)를 병합한다', () => {
    const meta = buildMetadata({ title: '글제목', description: '요약', path: '/blog/x' });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.siteName).toBe('raven.kr');
    expect(og.type).toBe('website');
    expect(og.title).toBe('글제목');
    expect(og.url).toBe('/blog/x');
  });
});
```

- [ ] **Step 6: 실패 확인**

Run: `pnpm test src/lib/metadata`
Expected: FAIL — siteName undefined.

- [ ] **Step 7: `buildMetadata` 수정 (base OG 병합)**

`src/lib/metadata/metadata.ts`의 `buildMetadata`를 교체:

```ts
export function buildMetadata(input: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const baseOg = baseMetadata.openGraph as Record<string, unknown>;
  return {
    title: input.title,
    description: input.description,
    openGraph: {
      ...baseOg,
      title: input.title,
      description: input.description,
      url: input.path,
    },
  };
}
```

- [ ] **Step 8: 통과 + 전체 확인 후 커밋**

Run: `pnpm test && pnpm typecheck && pnpm lint`

```bash
git add -A
git commit -m "feat: 읽기 시간 유틸 추가·buildMetadata의 base OG 병합"
```

---

### Task 3: mock 확장 + PostRow 컴포넌트

**Files:**

- Modify: `src/features/posts/fixtures/posts.mock.ts`
- Create: `src/features/posts/components/PostRow.tsx`, `src/features/posts/components/PostRow.module.css`
- Test: `src/features/posts/components/__tests__/PostRow.test.tsx`

**Interfaces:**

- Consumes: `PostListItem` (features/posts/types/posts.types), `ArrowLink` (@components/ui/ArrowLink), `ROUTES` (@constants/routes).
- Produces: `PostRow({ post }: { post: PostListItem })`.

- [ ] **Step 1: mock 확장 (`posts.mock.ts` 교체)**

````ts
import type { Post, PostListItem } from '@features/posts/types/posts.types';

export const mockPostList: PostListItem[] = [
  {
    slug: '가벼운-헥사고날로-nestjs-나누기',
    title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
    summary: '포트/어댑터를 최소로 쓰면서 모듈 경계를 지키는 법.',
    tags: ['nestjs', 'architecture'],
    published_at: '2026-06-24T00:00:00.000Z',
    updated_at: '2026-07-01T09:12:00.000Z',
    cover_image_url: null,
    reading_time_min: 8,
    status: 'published',
  },
  {
    slug: 'rsc-우선-데이터-패칭',
    title: 'RSC 우선 데이터 패칭 노트',
    summary: null,
    tags: ['nextjs', 'architecture'],
    published_at: '2026-07-03T00:00:00.000Z',
    updated_at: '2026-07-03T00:00:00.000Z',
    cover_image_url: null,
    status: 'published',
  },
];

const body1 = [
  '## 왜 헥사고날인가',
  '',
  '모듈 경계를 지키려면 의존 방향을 한쪽으로 모아야 한다.',
  '',
  '### 포트와 어댑터',
  '',
  '- 포트는 인터페이스',
  '- 어댑터는 구현',
  '',
  '```ts',
  'interface UserPort {',
  '  findById(id: string): Promise<User>;',
  '}',
  '```',
  '',
  '### 트레이드오프',
  '',
  '작은 프로젝트엔 과할 수 있다.',
].join('\n');

const body2 = [
  '## 서버에서 읽고 클라이언트는 최소로',
  '',
  '정적 콘텐츠는 RSC에서 직접 렌더한다.',
  '',
  '### 언제 TanStack Query인가',
  '',
  '검색·필터·폼처럼 상호작용이 생길 때만.',
].join('\n');

export const mockPostDetails: Record<string, Post> = {
  '가벼운-헥사고날로-nestjs-나누기': {
    ...mockPostList[0],
    body_markdown: body1,
    frontmatter: { date: '2026-06-24' },
  },
  'rsc-우선-데이터-패칭': {
    ...mockPostList[1],
    body_markdown: body2,
    frontmatter: { date: '2026-07-03' },
  },
};
````

- [ ] **Step 2: 기존 데이터 테스트 회귀 확인**

Run: `pnpm test src/features/posts`
Expected: 기존 posts.api 테스트 통과(첫 글 slug이 `가벼운-헥사고날로-nestjs-나누기`로 바뀌었으니, posts.api.test.ts가 특정 slug을 하드코딩했다면 이 스텝에서 실패한다. 실패 시 그 테스트의 기대 slug을 새 값으로 갱신).

> 참고: posts.api.test.ts의 mock 케이스는 길이/필드 위주이므로 대개 통과한다. slug 문자열을 단언하는 부분이 있으면 새 slug으로 수정하고 재실행.

- [ ] **Step 3: PostRow 실패 테스트**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostRow } from '@features/posts/components/PostRow';
import type { PostListItem } from '@features/posts/types/posts.types';

const base: PostListItem = {
  slug: '가벼운-헥사고날로-nestjs-나누기',
  title: '가벼운 헥사고날로 NestJS 모놀리스 나누기',
  summary: '요약 문장.',
  tags: ['nestjs'],
  published_at: '2026-06-24T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  cover_image_url: null,
  reading_time_min: 8,
  status: 'published',
};

describe('PostRow', () => {
  it('제목과 상세 링크를 렌더한다', () => {
    render(<PostRow post={base} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/blog/가벼운-헥사고날로-nestjs-나누기',
    );
  });
  it('summary가 null이어도 안전하게 렌더한다', () => {
    render(<PostRow post={{ ...base, summary: null }} />);
    expect(screen.getByText(base.title)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `pnpm test src/features/posts/components`
Expected: FAIL — PostRow 없음.

- [ ] **Step 5: PostRow 구현**

`src/features/posts/components/PostRow.module.css`:

```css
.row {
  padding-block: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.title {
  font-size: var(--fs-28);
  line-height: var(--lh-tight);
}
.summary {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
}
.meta {
  margin-top: var(--space-3);
  display: flex;
  gap: var(--space-3);
  font-size: var(--fs-13);
  color: var(--color-text-muted);
  font-family: var(--font-mono), monospace;
}
.footer {
  margin-top: var(--space-4);
}
```

`src/features/posts/components/PostRow.tsx`:

```tsx
import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import styles from './PostRow.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function PostRow({ post }: { post: PostListItem }) {
  return (
    <article className={styles.row}>
      <h2 className={styles.title}>{post.title}</h2>
      {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      <div className={styles.meta}>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <div className={styles.footer}>
        <ArrowLink href={ROUTES.BLOG.DETAIL(post.slug)}>Read article</ArrowLink>
      </div>
    </article>
  );
}
```

- [ ] **Step 6: 통과 + 커밋**

Run: `pnpm test src/features/posts && pnpm typecheck && pnpm lint`

```bash
git add -A
git commit -m "feat: mock 본문·한글 slug 확장 및 PostRow 컴포넌트 추가"
```

---

### Task 4: 목록 페이지 /blog (TagFilter + searchParams 필터)

**Files:**

- Create: `src/app/blog/page.tsx`, `src/app/blog/blog.module.css`
- Create: `src/app/blog/_components/TagFilter.tsx`, `src/app/blog/_components/TagFilter.module.css`
- Test: `src/app/blog/_components/__tests__/TagFilter.test.tsx`

**Interfaces:**

- Consumes: `getPosts` (features/posts/services/posts.api), `PostRow` (@features/posts/components/PostRow), `Container` (@components/layout/Container), `ROUTES`.
- Produces: `TagFilter({ tags, active }: { tags: string[]; active?: string })`.

- [ ] **Step 1: TagFilter 실패 테스트**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TagFilter } from '@/app/blog/_components/TagFilter';

describe('TagFilter', () => {
  it('전체 + 각 태그 링크를 렌더하고 활성 태그를 표시한다', () => {
    render(<TagFilter tags={['nestjs', 'nextjs']} active="nestjs" />);
    const all = screen.getByRole('link', { name: '전체' });
    expect(all).toHaveAttribute('href', '/blog');
    const nestjs = screen.getByRole('link', { name: '#nestjs' });
    expect(nestjs).toHaveAttribute('href', '/blog?tag=nestjs');
    expect(nestjs).toHaveAttribute('aria-current', 'true');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/app/blog/_components`
Expected: FAIL — TagFilter 없음.

- [ ] **Step 3: TagFilter 구현**

`src/app/blog/_components/TagFilter.module.css`:

```css
.filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-7);
  font-size: var(--fs-15);
}
.chip {
  color: var(--color-text-secondary);
}
.active {
  color: var(--color-accent);
}
```

`src/app/blog/_components/TagFilter.tsx`:

```tsx
import Link from 'next/link';
import { ROUTES } from '@constants/routes';
import styles from './TagFilter.module.css';

export function TagFilter({ tags, active }: { tags: string[]; active?: string }) {
  return (
    <nav className={styles.filter}>
      <Link
        href={ROUTES.BLOG.LIST}
        className={active ? styles.chip : styles.active}
        aria-current={active ? undefined : 'true'}
      >
        전체
      </Link>
      {tags.map((tag) => {
        const isActive = tag === active;
        return (
          <Link
            key={tag}
            href={`${ROUTES.BLOG.LIST}?tag=${encodeURIComponent(tag)}`}
            className={isActive ? styles.active : styles.chip}
            aria-current={isActive ? 'true' : undefined}
          >
            #{tag}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/app/blog/_components`
Expected: 1 passed.

- [ ] **Step 5: 목록 페이지 구현**

`src/app/blog/blog.module.css`:

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
```

`src/app/blog/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { PostRow } from '@features/posts/components/PostRow';
import { getPosts } from '@features/posts/services/posts.api';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { TagFilter } from '@/app/blog/_components/TagFilter';
import styles from './blog.module.css';

export const metadata: Metadata = buildMetadata({
  title: '글',
  description: '생각을 다듬는 기록.',
  path: ROUTES.BLOG.LIST,
});

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const all = await getPosts();
  const posts = tag ? await getPosts({ tag }) : all;
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort();

  return (
    <Container>
      <header className={styles.header}>
        <h1 className={styles.title}>글</h1>
      </header>
      <TagFilter tags={tags} active={tag} />
      {posts.length === 0 ? (
        <p className={styles.empty}>아직 글이 없어요.</p>
      ) : (
        posts.map((post) => <PostRow key={post.slug} post={post} />)
      )}
    </Container>
  );
}
```

- [ ] **Step 6: 빌드·전체 검증**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: 통과, `/blog` 생성.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 블로그 목록 페이지(/blog)와 태그 필터 추가"
```

---

### Task 5: 상세 표시 컴포넌트 (ArticleHeader/ArticleBody/PostNav + prose)

**Files:**

- Create: `src/app/blog/[slug]/_components/ArticleHeader.tsx` (+ `.module.css`)
- Create: `src/app/blog/[slug]/_components/ArticleBody.tsx` (+ `.module.css`)
- Create: `src/app/blog/[slug]/_components/PostNav.tsx` (+ `.module.css`)

**Interfaces:**

- Consumes: `Post`, `PostListItem` (posts.types), `ArrowLink`, `ROUTES`.
- Produces:
  - `ArticleHeader({ post }: { post: Post })`
  - `ArticleBody({ html }: { html: string })`
  - `PostNav({ prev, next }: { prev: PostListItem | null; next: PostListItem | null })`

(표시 전용 컴포넌트 — 이 태스크는 렌더 테스트 대신 다음 태스크의 조립/빌드로 검증한다. 각 컴포넌트는 props만 받는다.)

- [ ] **Step 1: ArticleHeader**

`ArticleHeader.module.css`:

```css
.header {
  padding-top: var(--space-9);
  margin-bottom: var(--space-8);
}
.title {
  font-size: var(--fs-56);
  line-height: var(--lh-tight);
  letter-spacing: -0.02em;
}
.meta {
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-3);
  font-size: var(--fs-13);
  color: var(--color-text-muted);
  font-family: var(--font-mono), monospace;
}
```

`ArticleHeader.tsx`:

```tsx
import type { Post } from '@features/posts/types/posts.types';
import styles from './ArticleHeader.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function ArticleHeader({ post }: { post: Post }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{post.title}</h1>
      <div className={styles.meta}>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        {post.reading_time_min ? <span>{post.reading_time_min}분</span> : null}
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: ArticleBody (.prose)**

`ArticleBody.module.css` — 렌더된 HTML을 `:global`로 타깃(토큰만 사용):

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

`ArticleBody.tsx`:

```tsx
import styles from './ArticleBody.module.css';

export function ArticleBody({ html }: { html: string }) {
  return <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 3: PostNav**

`PostNav.module.css`:

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

`PostNav.tsx`:

```tsx
import Link from 'next/link';
import type { PostListItem } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './PostNav.module.css';

export function PostNav({ prev, next }: { prev: PostListItem | null; next: PostListItem | null }) {
  if (!prev && !next) return null;
  return (
    <nav className={styles.nav}>
      {prev ? (
        <Link href={ROUTES.BLOG.DETAIL(prev.slug)}>
          <span className={styles.label}>이전 글</span>
          {prev.title}
        </Link>
      ) : null}
      {next ? (
        <Link className={styles.next} href={ROUTES.BLOG.DETAIL(next.slug)}>
          <span className={styles.label}>다음 글</span>
          {next.title}
        </Link>
      ) : null}
    </nav>
  );
}
```

- [ ] **Step 4: 타입·lint 확인 후 커밋**

Run: `pnpm typecheck && pnpm lint`

```bash
git add -A
git commit -m "feat: 상세 표시 컴포넌트(ArticleHeader/ArticleBody/PostNav)와 prose 스타일 추가"
```

---

### Task 6: TableOfContents (클라이언트, 활성 하이라이트)

**Files:**

- Create: `src/app/blog/[slug]/_components/TableOfContents.tsx` (+ `.module.css`)
- Test: `src/app/blog/[slug]/_components/__tests__/TableOfContents.test.tsx`

**Interfaces:**

- Consumes: `TocEntry` (@lib/markdown/toc.types).
- Produces: `TableOfContents({ toc }: { toc: TocEntry[] })` (`'use client'`).

- [ ] **Step 1: 실패 테스트 (렌더 + 앵커 링크)**

```tsx
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';

beforeAll(() => {
  // jsdom에는 IntersectionObserver가 없다 → 스텁
  class IO {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
});

describe('TableOfContents', () => {
  it('toc 항목을 앵커 링크로 렌더한다', () => {
    render(
      <TableOfContents
        toc={[
          { id: '왜-헥사고날인가', text: '왜 헥사고날인가', depth: 2 },
          { id: '포트와-어댑터', text: '포트와 어댑터', depth: 3 },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: '왜 헥사고날인가' })).toHaveAttribute(
      'href',
      '#왜-헥사고날인가',
    );
    expect(screen.getByRole('link', { name: '포트와 어댑터' })).toHaveAttribute(
      'href',
      '#포트와-어댑터',
    );
  });
  it('toc가 비면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<TableOfContents toc={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test "src/app/blog/[slug]/_components"`
Expected: FAIL — TableOfContents 없음.

- [ ] **Step 3: 구현**

`TableOfContents.module.css`:

```css
.toc {
  position: sticky;
  top: var(--space-8);
  font-size: var(--fs-13);
  line-height: 1.9;
}
.item {
  display: block;
  color: var(--color-text-muted);
}
.depth3 {
  padding-left: var(--space-3);
}
.active {
  color: var(--color-accent);
}
```

`TableOfContents.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { TocEntry } from '@lib/markdown/toc.types';
import styles from './TableOfContents.module.css';

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    for (const entry of toc) {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav className={styles.toc} aria-label="목차">
      {toc.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={`${styles.item} ${entry.depth === 3 ? styles.depth3 : ''} ${
            activeId === entry.id ? styles.active : ''
          }`}
        >
          {entry.text}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test "src/app/blog/[slug]/_components"`
Expected: 2 passed.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 활성 하이라이트 목차(TableOfContents) 컴포넌트 추가"
```

---

### Task 7: 상세 페이지 /blog/[slug] 조립

**Files:**

- Create: `src/app/blog/[slug]/page.tsx`, `src/app/blog/[slug]/article.module.css`

**Interfaces:**

- Consumes: `getPost`, `getPosts` (posts.api), `renderMarkdown` (@lib/markdown/render), `buildMetadata`, `ROUTES`, `ArticleHeader`, `ArticleBody`, `TableOfContents`, `PostNav`, `Container`.

- [ ] **Step 1: 레이아웃 CSS**

`src/app/blog/[slug]/article.module.css`:

```css
.layout {
  display: grid;
  grid-template-columns: minmax(0, var(--w-reading)) 1fr;
  gap: var(--space-8);
  align-items: start;
}
.aside {
  padding-top: var(--space-9);
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .aside {
    display: none;
  }
}
```

- [ ] **Step 2: 상세 페이지 구현**

`src/app/blog/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { getPost, getPosts } from '@features/posts/services/posts.api';
import { renderMarkdown } from '@lib/markdown/render';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { ArticleHeader } from '@/app/blog/[slug]/_components/ArticleHeader';
import { ArticleBody } from '@/app/blog/[slug]/_components/ArticleBody';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';
import { PostNav } from '@/app/blog/[slug]/_components/PostNav';
import styles from './article.module.css';

export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug.normalize('NFC'));
  return buildMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: ROUTES.BLOG.DETAIL(post.slug),
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = slug.normalize('NFC');
  const post = await getPost(key);
  const { html, toc } = await renderMarkdown(post.body_markdown);

  const all = await getPosts({ sort: '-published_at' });
  const index = all.findIndex((p) => p.slug === post.slug);
  const next = index > 0 ? all[index - 1] : null;
  const prev = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <Container>
      <div className={styles.layout}>
        <article>
          <ArticleHeader post={post} />
          <ArticleBody html={html} />
          <PostNav prev={prev} next={next} />
        </article>
        <aside className={styles.aside}>
          <TableOfContents toc={toc} />
        </aside>
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: 전체 검증**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: 모든 테스트 통과, 빌드 성공. `/blog/[slug]`가 generateStaticParams의 한글 slug로 정적 생성(예: `/blog/가벼운-헥사고날로-nestjs-나누기`).

- [ ] **Step 4: 로컬 확인**

Run: `pnpm dev` → 브라우저에서 `/blog`와 글 상세 열기.
Expected: 목록에 두 글, 태그 필터 동작(`?tag=nextjs`), 상세에 제목·메타·본문(코드 하이라이트)·목차(스크롤 시 활성)·이전/다음. 확인 후 dev 종료.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 블로그 상세 페이지(/blog/[slug]) 조립 및 정적 생성"
```

---

### Task 8: 계약 참조 v1→v2 승계 (문서 정리)

**Files:**

- Delete: `docs/api-contract/content-v1.md`
- Modify: `docs/references/content-api.md`, `.claude/CLAUDE.md`

**Interfaces:** 없음(문서).

- [ ] **Step 1: v1 참조를 v2로 교체**

- `docs/api-contract/content-v1.md` 삭제(`git rm docs/api-contract/content-v1.md`).
- `docs/references/content-api.md`에서 `content-v1.md` 링크를 `content-v2.md`로 변경하고, slug 규칙 섹션에 "유니코드(한글) slug + NFC 정규화 필수" 요지를 한 줄 추가(본문은 content-v2.md가 SSOT).
- `.claude/CLAUDE.md`의 API 계약 링크를 `../docs/api-contract/content-v2.md`로 변경.

- [ ] **Step 2: 남은 v1 참조 확인**

Run: `grep -rn "content-v1" docs .claude`
Expected: `docs/superpowers/`(과거 spec/plan) 외의 활성 참조 없음. (과거 foundation spec/plan의 v1 언급은 그대로 두어도 무방 — 이력이므로.)

- [ ] **Step 3: lint·빌드 확인 후 커밋**

Run: `pnpm lint && pnpm build`

```bash
git add -A
git commit -m "docs: 콘텐츠 계약 참조를 v1에서 v2로 승계"
```

---

## 최종 검증 (전체)

- [ ] `pnpm test`(전 스위트) → 통과, 출력 pristine
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 errors
- [ ] `pnpm build` → `/blog`, `/blog/[slug]`(한글 slug 정적 생성) 성공
- [ ] `pnpm dev`로 목록·필터·상세·목차·이전/다음 육안 확인
- [ ] 커밋들이 Conventional Commits 형식
