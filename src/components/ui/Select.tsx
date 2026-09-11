'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import styles from './Select.module.css';

export type SelectOption = { value: string; label: string };
export function Select({
  label,
  options,
  value,
  onValueChange,
  name,
  placeholder = '선택',
}: {
  label: string;
  options: readonly SelectOption[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  name?: string;
  placeholder?: string;
}) {
  return (
    <div className={styles.field}>
      <BaseSelect.Root items={options} value={value} onValueChange={onValueChange} name={name}>
        <BaseSelect.Label className={styles.label}>{label}</BaseSelect.Label>
        <BaseSelect.Trigger className={styles.trigger}>
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className={styles.icon}>⌄</BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner className={styles.positioner} sideOffset={6}>
            <BaseSelect.Popup className={styles.popup}>
              {options.map((option) => (
                <BaseSelect.Item className={styles.item} key={option.value} value={option.value}>
                  <BaseSelect.ItemIndicator className={styles.check}>✓</BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
