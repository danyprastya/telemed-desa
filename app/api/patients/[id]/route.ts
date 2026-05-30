// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { updatePatientSchema } from '@/lib/validations/patient.schema'

/**
 * GET /api/patients/[id] — Patient detail with latest vital.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !patient) return apiError('Pasien tidak ditemukan', 404)

  const { data: latestVital } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('patient_id', id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  return apiSuccess({ ...patient, latest_vital: latestVital })
}

/**
 * PUT /api/patients/[id] — Update patient info. Nurse or admin.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'nurse' && profile.role !== 'admin') return apiError('Forbidden', 403)

  const body = await request.json()
  const parsed = updatePatientSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { data, error } = await supabase
    .from('patients')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal memperbarui data pasien', 500)

  await logAudit({
    userId: profile.id,
    action: 'UPDATE_PATIENT',
    targetTable: 'patients',
    targetId: id,
    details: parsed.data,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(data)
}

/**
 * DELETE /api/patients/[id] — Soft delete. Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active || profile.role !== 'admin') return apiError('Forbidden', 403)

  const { count } = await supabase
    .from('consultations')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', id)
    .in('status', ['open', 'in_progress'])

  if (count && count > 0) {
    return apiError('Tidak dapat menghapus pasien dengan konsultasi aktif', 409)
  }

  const { data, error } = await supabase
    .from('patients')
    .update({ is_deleted: true })
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal menghapus pasien', 500)

  await logAudit({
    userId: profile.id,
    action: 'DELETE_PATIENT',
    targetTable: 'patients',
    targetId: id,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(data)
}
