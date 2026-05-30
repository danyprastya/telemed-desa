// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'

/**
 * GET /api/doctors — Get a list of all active doctors for consultation assignment.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('is_active').eq('id', user.id).single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, hospital_id')
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) return apiError('Gagal mengambil data dokter', 500)

  return apiSuccess(data ?? [])
}
