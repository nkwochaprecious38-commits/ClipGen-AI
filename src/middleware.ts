import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = req.nextUrl.pathname;
  const isApp = path.startsWith('/app');
  const isAuth = ['/login', '/signup', '/forgot-password'].includes(path);
  if (!configured) {
    // Never grant access when auth is not configured.
    if (isApp) { const u = req.nextUrl.clone(); u.pathname = '/login'; u.search = ''; return NextResponse.redirect(u); }
    return NextResponse.next();
  }
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (isApp && !user) { const u = req.nextUrl.clone(); u.pathname = '/login'; u.searchParams.set('next', path); return NextResponse.redirect(u); }
  if (isAuth && user) { const u = req.nextUrl.clone(); u.pathname = '/app'; u.search = ''; return NextResponse.redirect(u); }
  return res;
}
export const config = { matcher: ['/app/:path*', '/login', '/signup', '/forgot-password'] };
