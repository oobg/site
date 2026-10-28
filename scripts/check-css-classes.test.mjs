import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = resolve('scripts/check-css-classes.mjs');
function check(css, reference) {
  const root = mkdtempSync(join(tmpdir(), 'qw-css-'));
  try {
    mkdirSync(join(root, 'src'));
    writeFileSync(
      join(root, 'src/fixture.tsx'),
      `import styles from './fixture.module.css';\nconst className = ${reference};`,
    );
    writeFileSync(join(root, 'src/fixture.module.css'), css);
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
describe('CSS class gate fixtures', () => {
  it.each(['', '/* temporarily empty */'])('rejects referenced empty modules: %s', (css) => {
    expect(check(css, 'styles.missing').status).toBe(1);
  });
  it.each(['styles["missing"]', "styles['missing']", 'styles [ "missing" ]', 'styles.missing'])(
    'rejects missing static references: %s',
    (reference) => {
      const result = check('.present {}', reference);
      expect(result.status).toBe(1);
      expect(result.output).toContain('missing');
    },
  );
  it.each(['styles.present', 'styles["present"]', "styles['with-hyphen']"])(
    'accepts defined references: %s',
    (reference) => {
      expect(check('.present {} .with-hyphen {}', reference).status).toBe(0);
    },
  );
  it('accepts an unused empty module', () => {
    expect(check('', '"plain"').status).toBe(0);
  });
});
