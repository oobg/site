import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@configs/cms-env';

const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

/** Server-only privileged REST client. Callers must authorize each operation:
 * comments use their dedicated validation; admin post APIs require a verified Access JWT.
 * Google owner post APIs must keep using the session client and its RLS policies.
 */
export function createServiceClient() {
  const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, '');
  const internalUrl = process.env.SUPABASE_INTERNAL_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error('Database service is not configured');

  if (siteUrl === 'https://raven.kr') {
    if (internalUrl) throw new Error('Production database cannot use a dev internal endpoint');
    const { url } = getSupabaseConfig();
    if (new URL(url).protocol !== 'https:')
      throw new Error('Database service endpoint is not allowed');
    return createClient(url, serviceRoleKey, {
      auth,
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    });
  }

  if (siteUrl !== 'https://dev.raven.kr' || !internalUrl)
    throw new Error('Database service endpoint is not allowed');
  const parsed = new URL(internalUrl);
  if (
    parsed.protocol !== 'http:' ||
    parsed.hostname !== 'raven-supabase-dev-rest' ||
    parsed.port !== '3000'
  )
    throw new Error('Database service endpoint is not allowed');
  return createClient(internalUrl, serviceRoleKey, {
    auth,
    global: {
      fetch: (input, init) => {
        const target = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        );
        if (!target.pathname.startsWith('/rest/v1'))
          throw new Error('Database service requested an unsupported internal path');
        target.pathname = target.pathname.slice('/rest/v1'.length) || '/';
        return fetch(target, { ...init, cache: 'no-store' });
      },
    },
  });
}
