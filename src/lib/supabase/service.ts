import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.SUPABASE_INTERNAL_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error('Comment service is not configured');
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'http:' ||
    parsed.hostname !== 'raven-supabase-dev-rest' ||
    parsed.port !== '3000'
  )
    throw new Error('Comment service endpoint is not allowed');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const target = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        );
        if (!target.pathname.startsWith('/rest/v1'))
          throw new Error('Comment service requested an unsupported internal path');
        target.pathname = target.pathname.slice('/rest/v1'.length) || '/';
        return fetch(target, { ...init, cache: 'no-store' });
      },
    },
  });
}
