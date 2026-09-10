'use client';

import { Input as BaseInput } from '@base-ui/react/input';
import { forwardRef, useId, type ComponentProps } from 'react';
import styles from './Input.module.css';

export type InputProps = ComponentProps<typeof BaseInput> & {
  label: string;
  description?: string;
  error?: string;
};

export const Input = forwardRef<HTMLElement, InputProps>(function Input(
  { label, description, error, id: suppliedId, className, ...props },
  ref,
) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={styles.field} data-error={error ? '' : undefined}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <BaseInput
        ref={ref}
        id={id}
        className={[styles.input, className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {description && (
        <p className={styles.description} id={descriptionId}>
          {description}
        </p>
      )}
      {error && (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
});
