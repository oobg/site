import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync('scripts/check-analytics-privacy.mjs', 'utf8');
const verdict = source.slice(source.indexOf('for (const result of report)'));
const names = [
  'clean',
  'clean-spa',
  'initial-query',
  'initial-hash',
  'initial-admin',
  'initial-auth',
  'query-latch',
  'hash-latch',
  'admin-latch',
  'outbound',
  'mail',
  'download',
  'form',
  'referrer',
  'sdk-race',
];
function validResult(name) {
  const initial = name.startsWith('initial-');
  const race = name === 'sdk-race';
  const count = initial || race ? 0 : name === 'clean-spa' ? 2 : 1;
  return {
    name,
    blocked: initial || race || !['clean', 'clean-spa', 'referrer'].includes(name),
    loaded: !initial,
    sdkRequests: initial ? 0 : 1,
    packets: count,
    packetsAfterInteraction: name === 'clean-spa' ? 1 : 0,
    leakedPackets: 0,
    timedOut: false,
    transports: Array.from({ length: count }, (_, i) => ({
      event: 'page_view',
      tid: 'G-TEST',
      sequence: i + 1,
    })),
  };
}
async function rejected(report, selected = names) {
  const process = { env: {}, exitCode: 0 };
  await runInNewContext(`(async () => { ${verdict} })()`, {
    report,
    process,
    selectedScenarios: selected.map((name) => [name]),
    writeFile: async () => {},
    console: { log() {} },
  });
  return process.exitCode === 1;
}
describe('analytics privacy probe verdict', () => {
  it('accepts a complete report with all scenario expectations', async () => {
    expect(await rejected(names.map(validResult))).toBe(false);
  });
  it.each([
    [
      'clean-spa',
      {
        transports: [{ event: 'page_view', tid: 'G-TEST', sequence: 1 }],
        packetsAfterInteraction: 0,
      },
    ],
    ['initial-query', { sdkRequests: 1 }],
    ['initial-hash', { blocked: false }],
    ['initial-admin', { packets: 1 }],
    ['initial-auth', { loaded: true }],
    ['query-latch', { blocked: false }],
    ['hash-latch', { packetsAfterInteraction: 1 }],
    ['admin-latch', { packetsAfterInteraction: 1 }],
    ['outbound', { blocked: false }],
    ['mail', { packetsAfterInteraction: 1 }],
    ['download', { packetsAfterInteraction: 1 }],
    ['form', { blocked: false }],
    ['referrer', { loaded: false }],
    ['sdk-race', { packets: 1 }],
    ['clean', { timedOut: true }],
    ['clean', { leakedPackets: 1 }],
  ])('rejects a regression in %s: %j', async (name, change) => {
    const report = names.map(validResult);
    Object.assign(
      report.find((row) => row.name === name),
      change,
    );
    expect(await rejected(report)).toBe(true);
  });
  it('rejects missing selected scenarios and empty or unknown selections', async () => {
    expect(await rejected([validResult('clean')])).toBe(true);
    expect(await rejected([], [])).toBe(true);
    expect(await rejected([], ['typo'])).toBe(true);
  });
  it('accepts an explicitly selected subset without requiring clean', async () => {
    expect(await rejected([validResult('initial-query')], ['initial-query'])).toBe(false);
  });
});
