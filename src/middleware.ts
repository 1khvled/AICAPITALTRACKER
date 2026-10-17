import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Refreshes the Supabase session on every request and gates /admin* +
 * /api/admin* to authenticated admin users.
 * Build-safe: if Supabase env is missing, requests pass through untouched.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  if (!isAdminRoute && !isAdminApi) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  try {
    let supabaseResponse = NextResponse.next({ request: req });
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(
            ({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Service-role bypass (server-to-server / automation).
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const authHeader = req.headers.get('authorization');
      if (serviceKey && authHeader === `Bearer ${serviceKey}`) {
        return supabaseResponse;
      }
    } catch {
      // ignore and continue with user auth
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/';
      loginUrl.searchParams.set('login', 'required');
      return NextResponse.redirect(loginUrl);
    }

    // Bootstrap admin bypass for first-time setup.
    try {
      const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL;
      if (bootstrap && user.email?.toLowerCase() === bootstrap.toLowerCase()) {
        return supabaseResponse;
      }
    } catch {
      // ignore
    }

    // Admin check via admin_users table.
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) {
        if (isAdminApi) {
          return NextResponse.json(
            { error: 'Forbidden: admin access required' },
            { status: 403 }
          );
        }
        const deniedUrl = req.nextUrl.clone();
        deniedUrl.pathname = '/';
        deniedUrl.searchParams.set('login', 'required');
        deniedUrl.searchParams.set('error', 'forbidden');
        return NextResponse.redirect(deniedUrl);
      }
    } catch {
      if (isAdminApi) {
        return NextResponse.json(
          { error: 'Forbidden: admin access required' },
          { status: 403 }
        );
      }
      const deniedUrl = req.nextUrl.clone();
      deniedUrl.pathname = '/';
      deniedUrl.searchParams.set('login', 'required');
      deniedUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(deniedUrl);
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
