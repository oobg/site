import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/deploy-dev.yml', 'utf8');
const beforeMutation = workflow.split('- name: dev Access 설정 반영')[0];
const verification = beforeMutation
  .split('- name: 정적 검증')[1]
  .split('\n      #')[0]
  .split('run: |\n')[1]
  .split('\n')
  .map((line) => line.replace(/^          /, ''))
  .join('\n');
function runVerification(failingGate = '') {
  const root = mkdtempSync(join(tmpdir(), 'qw-dev-gates-'));
  try {
    const bin = join(root, 'bin');
    mkdirSync(bin);
    const pnpm = join(bin, 'pnpm');
    writeFileSync(
      pnpm,
      '#!/bin/bash\nprintf "%s\\n" "$1" >> "$QW_GATE_CALLS"\nif [ "$1" = "$QW_FAIL_GATE" ]; then exit 1; fi\n',
    );
    chmodSync(pnpm, 0o755);
    const calls = join(root, 'calls');
    const result = spawnSync('bash', ['-c', verification], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        TMPDIR: root,
        QW_GATE_CALLS: calls,
        QW_FAIL_GATE: failingGate,
      },
    });
    return { status: result.status, calls: readFileSync(calls, 'utf8').trim().split('\n') };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
describe('dev deployment gates', () => {
  it.each(['typecheck', 'lint', 'test', 'check:css', 'check:design'])(
    'runs pnpm %s before changing the host',
    (gate) => {
      expect(beforeMutation).toContain(`pnpm ${gate}`);
    },
  );
  it('accepts the static step only when all four commands succeed', () => {
    const result = runVerification();
    expect(result.status).toBe(0);
    expect(result.calls.sort()).toEqual(['check:css', 'check:design', 'lint', 'typecheck']);
  });
  it.each(['typecheck', 'lint', 'check:css', 'check:design'])(
    'fails the real shell step when %s fails',
    (gate) => {
      expect(runVerification(gate).status).toBe(1);
    },
  );
});
