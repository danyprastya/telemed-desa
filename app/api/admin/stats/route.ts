import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'

/**
 * GET /api/admin/stats — System-wide statistics. Admin only.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single() as { data: any; error: any }
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'admin' && profile.role !== 'doctor') return apiError('Forbidden', 403)

  const [
    patientsResult, nursesResult, doctorsResult,
    openConsultations, inProgressConsultations, closedTodayResult,
    puskesmasResult, hospitalsResult,
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'nurse').eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'doctor').eq('is_active', true),
    supabase.from('consultations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('consultations').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('consultations').select('id', { count: 'exact', head: true })
      .eq('status', 'closed')
      .gte('closed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('puskesmas').select('id', { count: 'exact', head: true }),
    supabase.from('hospitals').select('id', { count: 'exact', head: true }),
  ])

  return apiSuccess({
    total_patients: patientsResult.count ?? 0,
    total_nurses: nursesResult.count ?? 0,
    total_doctors: doctorsResult.count ?? 0,
    open_consultations: openConsultations.count ?? 0,
    in_progress_consultations: inProgressConsultations.count ?? 0,
    closed_consultations_today: closedTodayResult.count ?? 0,
    total_puskesmas: puskesmasResult.count ?? 0,
    total_hospitals: hospitalsResult.count ?? 0,
  })
}
