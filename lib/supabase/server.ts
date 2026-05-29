import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for server components and API routes.
 * Uses the anon key with RLS enforced via the user's session cookie.
 * Use this for all standard reads/writes that respect RLS.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can fail in Server Components when called from a
            // page that is being statically generated. This is expected.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with the service role key.
 * This client BYPASSES ALL RLS POLICIES.
 * Use ONLY in /app/api/** route handlers for admin-level operations:
 * - Creating auth users (admin user management)
 * - Writing notifications (server-triggered, not user-initiated)
 * - Writing audit logs
 * NEVER use this in client components, hooks, or lib files other than this one.
 */
export function createAdminSupabaseClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  )
}
