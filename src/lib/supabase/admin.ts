import 'server-only';
import { clipgenApi } from './wrap';
import { createClient } from '@supabase/supabase-js';
// Service role client. Server only. Bypasses RLS: every call site must authorize the user first.
export function adminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return clipgenApi(createClient<any, 'public'>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }));
}
