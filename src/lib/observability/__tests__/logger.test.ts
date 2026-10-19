import { afterEach, describe, expect, it, vi } from 'vitest';
import { logOperation } from '@lib/observability/logger';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('operation logging', () => {
  it('does not serialize extra error or user data and rejects an unsafe revision', () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('RAVEN_RELEASE_SHA', 'private@example.test');
    const input = {
      operation: 'post_cache_invalidation' as const,
      code: 'CACHE_INVALIDATION_FAILED' as const,
      body: 'private comment',
      error: new Error('secret'),
    };
    logOperation(input);
    expect(output).toHaveBeenCalledWith({
      operation: input.operation,
      code: input.code,
      level: 'error',
      revision: null,
      timestamp: expect.any(String),
    });
    expect(JSON.stringify(output.mock.calls)).not.toMatch(/private|secret/);
  });
  it('records a validated revision for a partial report failure', () => {
    const output = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('RAVEN_RELEASE_SHA', 'a'.repeat(40));
    logOperation({
      operation: 'analytics_locations',
      code: 'GA_LOCATION_REPORT_FAILED',
      level: 'warn',
    });
    expect(output).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 'a'.repeat(40), level: 'warn' }),
    );
  });
});
