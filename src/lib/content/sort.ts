import type { ContentListItem, ListParams } from '@lib/api/contract.types';

/** 콘텐츠 목록을 수정하지 않고 API 정렬 문법과 같은 순서로 반환한다. */
export function sortContentItems(
  items: ContentListItem[],
  sort: NonNullable<ListParams['sort']>,
): ContentListItem[] {
  const descending = sort.startsWith('-');
  const key =
    sort === 'title' ? 'title' : sort.endsWith('updated_at') ? 'updated_at' : 'published_at';
  return [...items].sort((a, b) => {
    const left = String(a[key] ?? '');
    const right = String(b[key] ?? '');
    return descending ? right.localeCompare(left) : left.localeCompare(right);
  });
}
