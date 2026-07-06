# 블로그 읽기 경험 (목록 + 상세) 설계

> 상태: 합의됨. foundation 마일스톤(2026-07-06 main 병합) 위에 얹는 첫 기능 마일스톤.
> 상위: PPOS 헌장, `docs/references/*`(컨벤션 SSOT), API 계약 `docs/api-contract/content-v2.md`.

## 1. 배경과 목표

PPOS의 본질은 "thinking is the product · reading first". 이 마일스톤은 **블로그 목록(/blog)과
상세(/blog/[slug]) 읽기 경험**을 만든다. foundation의 데이터 계층(`getPosts`/`getPost`,
mock↔api 어댑터)을 처음으로 목록+상세에 걸쳐 끝까지 태운다. 백엔드 `/content/*`는 아직 미구현이라
**mock으로 만들고 `CONTENT_SOURCE=api`로 전환**한다.

### 확정된 결정

- **마크다운 렌더링**: `unified`(remark→rehype) 파이프라인을 RSC에서 await → HTML. 코드는
  **shiki(서버, 클라이언트 JS 0)**, TOC는 rehype-slug id 기반 추출.
- **읽기 UX**: 핵심(reading time·날짜·태그·이전/다음) + **활성 TOC 하이라이트**(sticky, 스크롤 시 현재
  섹션 강조). 본문은 서버 렌더, **TOC만 클라이언트 컴포넌트**.
- **목록 필터**: `?tag=` **RSC searchParams 서버 필터**(클라이언트 JS 0, 공유 가능 URL).
- **slug**: **한글 유니코드 slug**(오너 결정). 예 `/blog/가벼운-헥사고날-nestjs-나누기`. 계약 v2로
  규칙 변경(백엔드 합의됨) — 아래 §7.
- **범위**: 목록 + 상세만.

## 2. 라우트 & 파일 구조

```
src/app/blog/
  page.tsx                     # 서버: searchParams.tag → getPosts({tag}) → 목록
  _components/
    TagFilter.tsx              # 태그 칩(각 칩 = ?tag= <Link>, 활성 표시). 서버 컴포넌트
  [slug]/
    page.tsx                   # 서버: getPost → renderMarkdown → 조립.
                               #   generateStaticParams / generateMetadata
    _components/
      ArticleHeader.tsx        # 제목·날짜·reading time·태그
      ArticleBody.tsx          # 서버: dangerouslySetInnerHTML(html) + .prose
      TableOfContents.tsx      # 'use client': toc[] + IntersectionObserver 활성 하이라이트
      PostNav.tsx              # 이전/다음 글 링크
src/features/posts/components/
  PostRow.tsx (+ .module.css)  # 재사용: 글 요약 행(제목·요약·날짜·태그·ArrowLink)
src/lib/markdown/
  render.ts                    # server-only: renderMarkdown(md) → { html, toc }
  reading-time.ts              # computeReadingTime(md) → number(분)
  toc.types.ts                 # TocEntry
```

`PostRow`는 목록과 (향후) 랜딩 재사용 → `features/posts/components/`.

## 3. 마크다운 렌더링 (`lib/markdown/render.ts`, server-only)

```ts
export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}
export async function renderMarkdown(md: string): Promise<{ html: string; toc: TocEntry[] }>;
```

- 파이프라인: `unified().use(remarkParse).use(remarkGfm).use(remarkRehype)
.use(rehypeSlug).use(rehypeShiki, { theme }).use(collectToc, { toc }).use(rehypeStringify)`.
- TOC: rehype-slug가 heading에 id 부여 후, 작은 rehype 플러그인(`collectToc`)이 h2/h3를 순회
  (`unist-util-visit`)해 `{ id, text, depth }`를 수집. 또는 동일 로직을 별도 hast 순회로.
- 코드 하이라이팅: **shiki**(라이트 테마, PPOS canvas에 맞춤; 예 `github-light`/`min-light`).
  서버에서 실행 → 클라이언트 JS 0.
- 원문은 오너 소유(신뢰) 콘텐츠. 단 raw HTML 임베드는 이번 범위 밖(remark-rehype 기본 동작대로
  drop). 위키링크·콜아웃 등 Obsidian 확장 문법도 범위 밖(추후 remark 플러그인).
- 신규 의존성: `unified remark-parse remark-gfm remark-rehype rehype-slug rehype-stringify
@shikijs/rehype unist-util-visit` (+ `@types/hast` 필요 시).

## 4. 상세 페이지 `/blog/[slug]` (서버)

- `page.tsx`(서버, async):
  - `const { slug } = await params; const key = slug.normalize('NFC')` — Next 16에서 `params`는 이미
    URL 디코딩되어 오고 Promise이므로 이중 디코딩 없이 **NFC 정규화만**(§7). `getPost(key)`로 조회,
    없으면 `getPost`가 `notFound()`.
  - `renderMarkdown(post.body_markdown)` → `{ html, toc }`.
  - `getPosts()`(정렬)로 이전/다음 이웃 계산 → `PostNav`.
  - 2열 레이아웃: 본문(720px `--w-reading`) + `TableOfContents` aside(sticky, 넓은 화면만; 좁은
    화면은 숨김/접힘).
- `generateStaticParams`: `getPosts()` → slug 목록(이미 NFC). `dynamicParams: true`로 신규 글은
  요청 시 렌더 + revalidate 태그로 갱신.
- `generateMetadata(params)`: `getPost(slug)` → `buildMetadata({ title, description: summary ??
undefined, path: ROUTES.BLOG.DETAIL(slug) })`.
  - **이월 항목 수정**: `buildMetadata`가 `baseMetadata.openGraph`(type·siteName)를 **병합**하도록
    이 마일스톤에서 고친다(현재는 새 openGraph를 반환해 siteName/type 유실).
- `ArticleBody`(서버): `<div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />`.
- `TableOfContents`(`'use client'`): `toc` prop, IntersectionObserver로 현재 heading 활성 표시.
  **이 마일스톤의 유일한 클라이언트 조각.** `_container` 없이 컴포넌트 단위 `'use client'`.
- `PostNav`: 표시 전용, prev/next `ContentListItem | null` prop.

## 5. 목록 페이지 `/blog` (서버)

- `page.tsx`(서버): `searchParams.tag` → `getPosts({ tag })`. `TagFilter`(전체 태그 + 활성) +
  `PostRow` 목록. 결과 0건이면 조용한 빈 상태 문구.
- `TagFilter`: 태그 칩들, 각 칩 `<Link href={tag ? '/blog?tag='+tag : '/blog'}>`. "전체" 칩 포함.
  현재 `searchParams.tag`와 일치하는 칩 활성 스타일.
- `PostRow`(`features/posts/components/`): 제목(큰 타이포)·`summary ?? ''`·날짜·태그·`Read →`.
  카드 없이 행 + subtle divider(PPOS "dense reading, not cards").
- 페이지네이션 범위 밖(전체 반환).

## 6. 스타일 · 데이터 · 테스트

- **`.prose`**: `ArticleBody.module.css`에서 `.prose :global(h2/h3/p/ul/ol/blockquote/pre/code/a/
img/hr/table)`을 PPOS 토큰으로. 읽기 폭 720, 리듬 여백(`--space-*`), 링크 accent, 코드블록은 shiki
  출력(`pre.shiki`) 배경/패딩/radius 토큰.
- **mock 확장**: `posts.mock.ts`에 헤딩(H2/H3)·코드블록·리스트를 포함한 현실적 본문 + **한글 slug**
  1~2개 추가(TOC·하이라이팅·목록·이웃 검증용). `summary`는 string과 null 케이스 각각 1개.
- **테스트(TDD 위주)**:
  1. `renderMarkdown`: heading → `<h2 id="...">` + `toc`에 올바른 `{id,text,depth}`; 코드펜스 →
     shiki `<pre>`(class 포함). (RED→GREEN)
  2. `computeReadingTime`: 단어 수 → 분(반올림, 최소 1).
  3. `PostRow` 렌더: 제목·날짜·상세 링크(`/blog/<slug>`)·`summary=null`일 때 안전.
  4. `TableOfContents` 렌더: `toc` prop → 앵커 링크(#id) 목록.
  5. `buildMetadata`: 반환 openGraph에 base의 siteName·type이 병합되는지.
- 슬러그 인코딩: `PostRow`/`PostNav`/`generateStaticParams`는 slug을 그대로 사용, Next `<Link>`가
  href 인코딩. `[slug]/page.tsx`는 param을 NFC 정규화 후 조회.

## 7. slug 규칙 v2 (백엔드 합의됨)

- 규칙: 소문자화 + 공백→하이픈 + 한글(가-힣)·영소문자·숫자·하이픈 유지, 그 외 문장부호 제거, 연속
  하이픈 축약, 앞뒤 하이픈 trim. 예 정규식 `^[가-힣a-z0-9]+(?:-[가-힣a-z0-9]+)*$`.
- **NFC 정규화 필수**: slug 출처가 Obsidian 파일명인데 macOS는 한글을 NFD(자모 분해형)로 저장 →
  완성형 범위에 안 걸림. 백엔드는 ingest 시 slug·본문을 `normalize('NFC')`. **프론트도** URL 파라미터를
  조회 전에 NFC 정규화(§4).
- 백엔드가 `content-v2.md`로 계약 갱신 중. 구현 착수 시 프론트 repo의 참조 사본을
  `docs/api-contract/content-v2.md`로 새로고침하고, foundation의 `content-v1.md` 참조를 v2로 승계.

## 8. 명시적 범위 밖

태그 전용 경로(/blog/tag/[tag]), RSS 피드, 동적 OG 이미지, 페이지네이션, 댓글, Obsidian 확장 문법
(위키링크·콜아웃·임베드), raw HTML 임베드, 검색. 각각 후속 마일스톤.
