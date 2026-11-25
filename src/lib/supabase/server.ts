import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function createClient() {
  const store = await cookies();
  return createServerClient<any, 'clipgen'>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: 'clipgen' },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* server component */ } },
    },
  });
}
