import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { createClient as createJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client bound to request cookies (anon key).
 * Returns null when env is not configured (build-safe / local dataset fallback).
 */
export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  try {
    const cookieStore = await cookies();
    return createSsrServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without mutable cookies — safe to ignore.
          }
        },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Privileged service-role client. SERVER-ONLY — never import in client components.
 * Returns null when env is not configured.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  try {
    return createJsClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
