import Link from 'next/link';
import { ROUTES } from '@constants/routes';
import styles from './TagFilter.module.css';

/** 선택은 칩 모양 위에 얹는 상태다. .active가 .chip을 대체하면 선택된 항목만
    여백·보더·라운딩을 잃고, 그러면 상태 차이가 아니라 종류 차이로 읽힌다. */
function chipClass(isActive: boolean): string {
  return isActive ? `${styles.chip} ${styles.active}` : styles.chip;
}

export function TagFilter({ tags, active }: { tags: string[]; active?: string }) {
  return (
    <nav className={styles.filter} aria-label="태그 필터">
      <Link
        href={ROUTES.BLOG.LIST}
        className={chipClass(!active)}
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
            className={chipClass(isActive)}
            aria-current={isActive ? 'true' : undefined}
          >
            #{tag}
          </Link>
        );
      })}
    </nav>
  );
}
