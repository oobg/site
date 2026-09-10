'use client';

import { Tabs } from '@base-ui/react/tabs';
import type { ReactNode } from 'react';
import styles from './CategoryTabs.module.css';

export type CategoryTab = { id: string; name: string };
export function CategoryTabs({
  categories,
  value,
  onValueChange,
  children,
  label = '카테고리',
}: {
  categories: readonly CategoryTab[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <Tabs.Root value={value} onValueChange={(next) => onValueChange(String(next))}>
      <Tabs.List className={styles.list} aria-label={label}>
        {categories.map((category) => (
          <Tabs.Tab className={styles.tab} key={category.id} value={category.id}>
            {category.name}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className={styles.indicator} />
      </Tabs.List>
      <Tabs.Panel className={styles.panel} value={value}>
        {children}
      </Tabs.Panel>
    </Tabs.Root>
  );
}
