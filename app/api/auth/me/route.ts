// @ts-nocheck
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, puskesmas_id, hospital_id, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return apiError('Profile not found', 404)

  return apiSuccess(profile)
}
