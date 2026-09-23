import { describe, expect, it } from 'vitest';
import type {
  BlogCategoryWithCount,
  BlogHomeSection,
  BlogPostSummary,
} from '@features/posts/types/posts.types';
import { planHomeSections } from '@features/posts/utils/home-sections';

function category(slug: string, post_count = 3): BlogCategoryWithCount {
  return { id: slug, slug, name: slug, sort_order: 0, is_default: false, post_count };
}

function post(slug: string, cat: BlogCategoryWithCount, published_at = '2026-09-01T00:00:00Z') {
  return {
    slug,
    title: slug,
    summary: null,
    tags: [],
    published_at,
    updated_at: published_at,
    cover_image_url: null,
    status: 'published',
    category: cat,
    cover_image_key: null,
    cover_position: { x: 0.5, y: 0.5 },
    cover_alt: null,
    pin_order: null,
  } satisfies BlogPostSummary;
}

const slugs = (posts: readonly BlogPostSummary[]) => posts.map((item) => item.slug);
const sectionSlugs = (sections: readonly BlogHomeSection[]) =>
  sections.map((section) => [section.category.slug, slugs(section.posts)]);

describe('planHomeSections', () => {
  const design = category('design');
  const skills = category('skills', 2);
  const memory = category('memory', 5);

  /* 운영에서 본 배치: 에이전트 스킬 두 글이 추천·최근에 모두 먼저 나온다. */
  const questionDesign = post('question-design', skills, '2026-09-11T00:00:00Z');
  const uxWriting = post('ux-writing', skills, '2026-09-11T00:00:00Z');
  const m = [1, 2, 3, 4, 5].map((n) => post(`m0${n}`, memory, `2026-09-0${n}T00:00:00Z`));
  const d = [0, 1, 2].map((n) => post(`d0${n}`, design, '2026-08-01T00:00:00Z'));
  const latest = [questionDesign, uxWriting, m[4], m[3], m[2], m[1], m[0], ...d];
  const sections: BlogHomeSection[] = [
    { category: design, posts: d },
    { category: skills, posts: [questionDesign, uxWriting] },
    { category: memory, posts: m.slice(0, 3) },
  ];

  it('앞 섹션에 나온 글을 뒤 섹션에서 빼고, 새 글이 없는 섹션은 뺀다', () => {
    const plan = planHomeSections({
      featured: [questionDesign, d[0], m[0]],
      latest,
      sections,
    });
    expect(slugs(plan.featured)).toEqual(['question-design', 'd00', 'm01']);
    expect(slugs(plan.recent)).toEqual(['ux-writing', 'm05', 'm04']);
    expect(sectionSlugs(plan.sections)).toEqual([
      ['design', ['d01', 'd02']],
      ['memory', ['m02', 'm03']],
    ]);
  });

  it('섹션 후보가 모자라면 최신 목록의 같은 카테고리 글로 채운다', () => {
    const plan = planHomeSections(
      { featured: [], latest: [m[4], m[3]], sections },
      {
        recentCount: 1,
      },
    );
    expect(slugs(plan.recent)).toEqual(['m05']);
    // 섹션이 준 m01~m03 뒤에 최신 목록의 m04가 이어지지만 세 칸에서 멈춘다.
    expect(sectionSlugs(plan.sections).at(-1)).toEqual(['memory', ['m01', 'm02', 'm03']]);

    const exhausted = planHomeSections(
      { featured: [m[0], m[1]], latest: [m[4], m[3]], sections: [sections[2]] },
      { recentCount: 1 },
    );
    expect(sectionSlugs(exhausted.sections)).toEqual([['memory', ['m03', 'm04']]]);

    // 최신 목록은 최신순이지만 보충은 시리즈 순(m04 → m05)으로 잇는다.
    const ordered = planHomeSections(
      { featured: [m[0], m[1]], latest: [m[4], m[3]], sections: [sections[2]] },
      { recentCount: 0 },
    );
    expect(sectionSlugs(ordered.sections)).toEqual([['memory', ['m03', 'm04', 'm05']]]);
  });

  it('글이 하나뿐이어도 한 번만 보인다', () => {
    const only = post('only', design);
    const plan = planHomeSections({
      featured: [only],
      latest: [only],
      sections: [{ category: design, posts: [only] }],
    });
    expect(slugs(plan.featured)).toEqual(['only']);
    expect(plan.recent).toEqual([]);
    expect(plan.sections).toEqual([]);
  });

  it('추천이 없으면 최근 글부터 채우고 섹션 순서를 지킨다', () => {
    const plan = planHomeSections({ featured: [], latest, sections });
    expect(slugs(plan.recent)).toEqual(['question-design', 'ux-writing', 'm05']);
    expect(sectionSlugs(plan.sections).map(([slug]) => slug)).toEqual(['design', 'memory']);
  });
});
