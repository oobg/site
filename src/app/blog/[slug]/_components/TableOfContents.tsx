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
      <p className={styles.label}>목차</p>
      <ul className={styles.list}>
        {toc.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={`${styles.item} ${entry.depth === 3 ? styles.depth3 : ''} ${
                activeId === entry.id ? styles.active : ''
              }`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
