import styles from './ProcessDiagram.module.css';

/** 사고 흐름을 3단계 기하 도형으로 표현: 관찰 → 이해 → 구축.
    장식이 아니라 원/삼각형/사각형 프리미티브로 프로세스를 나타내는 다이어그램. */
const STEPS = [
  { label: 'Observe', shape: 'circle' as const },
  { label: 'Understand', shape: 'triangle' as const },
  { label: 'Build', shape: 'square' as const },
];

function Shape({ kind }: { kind: 'circle' | 'triangle' | 'square' }) {
  const stroke = 'var(--color-text)';
  if (kind === 'circle') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <circle cx="22" cy="22" r="20" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === 'triangle') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <path d="M22 3 L41 39 L3 39 Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect x="4" y="4" width="36" height="36" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

export function ProcessDiagram() {
  return (
    <div className={styles.diagram} role="img" aria-label="관찰, 이해, 구축의 3단계 사고 흐름">
      {STEPS.map((step) => (
        <div key={step.label} className={styles.node}>
          <span className={styles.shape}>
            <Shape kind={step.shape} />
          </span>
          <span className={styles.label}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
