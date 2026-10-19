import 'server-only';

type Operation =
  'post_path_revalidation' | 'post_cache_invalidation' | 'analytics_report' | 'analytics_locations';
type Code =
  | 'CACHE_REVALIDATION_FAILED'
  | 'CACHE_INVALIDATION_FAILED'
  | 'GA_REPORT_FAILED'
  | 'GA_LOCATION_REPORT_FAILED';

/** Deliberately accepts no error object, URL, body, account, or arbitrary context. */
export function logOperation({
  operation,
  code,
  level = 'error',
}: {
  operation: Operation;
  code: Code;
  level?: 'error' | 'warn';
}) {
  const candidate = process.env.RAVEN_RELEASE_SHA ?? '';
  const entry = {
    timestamp: new Date().toISOString(),
    operation,
    code,
    level,
    revision: /^[0-9a-f]{40}$/.test(candidate) ? candidate : null,
  };
  console[level](entry);
}
