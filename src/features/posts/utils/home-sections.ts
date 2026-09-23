import type { BlogHomeSection, BlogPostSummary } from '@features/posts/types/posts.types';
import { comparePostSeriesOrder } from '@features/posts/utils/series';

export interface HomeSectionsInput {
  featured: readonly BlogPostSummary[];
  /** 최신순 목록. 최근 글을 채우고, 카테고리 섹션의 후보가 모자랄 때 보충한다. */
  latest: readonly BlogPostSummary[];
  sections: readonly BlogHomeSection[];
}

export interface HomeSectionsPlan {
  featured: BlogPostSummary[];
  recent: BlogPostSummary[];
  sections: BlogHomeSection[];
}

/**
 * 홈 섹션을 그리는 순서(추천 → 최근 → 카테고리) 그대로 한 번씩만 글을 배정한다.
 * 앞 섹션에 이미 나온 글은 뒤 섹션에서 빠지고, 빈자리는 그 섹션의 다음 후보로 채운다.
 * 채울 글이 하나도 남지 않은 카테고리 섹션은 통째로 뺀다 — 제목만 있고 새 글이 없는
 * 섹션은 이미 본 것을 다시 가리킬 뿐이다. 카테고리 목록은 사이드바가 따로 연다.
 */
export function planHomeSections(
  { featured, latest, sections }: HomeSectionsInput,
  { recentCount = 3, sectionCount = 3 }: { recentCount?: number; sectionCount?: number } = {},
): HomeSectionsPlan {
  const seen = new Set<string>();
  const take = (candidates: readonly BlogPostSummary[], limit: number) => {
    const picked: BlogPostSummary[] = [];
    for (const post of candidates) {
      if (picked.length >= limit) break;
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      picked.push(post);
    }
    return picked;
  };

  const plannedFeatured = take(featured, featured.length);
  const recent = take(latest, recentCount);
  const plannedSections = sections
    .map((section) => {
      /* 섹션이 준 순서(시리즈 순)를 먼저 따르고, 모자라면 최신 목록의 같은
         카테고리 글을 시리즈 순으로 이어 붙인다. */
      const extra = latest
        .filter((post) => post.category.slug === section.category.slug)
        .sort(comparePostSeriesOrder);
      return {
        category: section.category,
        posts: take([...section.posts, ...extra], sectionCount),
      };
    })
    .filter((section) => section.posts.length > 0);

  return { featured: plannedFeatured, recent, sections: plannedSections };
}
