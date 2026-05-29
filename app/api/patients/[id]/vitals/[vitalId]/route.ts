import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'

/**
 * GET /api/patients/[id]/vitals/[vitalId]
 * Single vital sign record.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; vitalId: string }> }
) {
  const { id, vitalId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data, error } = await supabase
    .from('vital_signs')
    .select('*, recorder:recorded_by(full_name)')
    .eq('id', vitalId)
    .eq('patient_id', id)
    .single()

  if (error || !data) return apiError('Data tanda vital tidak ditemukan', 404)
  return apiSuccess(data)
}
