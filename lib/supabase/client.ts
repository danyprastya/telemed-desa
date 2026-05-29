import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for use in browser (client components and hooks).
 * Uses the anon key only. All data access is enforced by RLS policies.
 * Do NOT use this client in API routes or server components.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
