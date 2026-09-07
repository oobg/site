import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { getSupabaseConfig } from '@configs/cms-env';

export function createPublicClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}
