// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { createNotification } from '@/lib/utils/notifications.utils'
import { updateConsultationSchema } from '@/lib/validations/consultation.schema'

/**
 * GET /api/consultations/[id] — Detail with patient, vitals, messages.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: consultation, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !consultation) return apiError('Konsultasi tidak ditemukan', 404)

  const { data: patient } = await supabase.from('patients').select('*').eq('id', consultation.patient_id).single()
  const { data: nurse } = await supabase.from('profiles').select('*').eq('id', consultation.nurse_id).single()
  const doctor = consultation.doctor_id
    ? (await supabase.from('profiles').select('*').eq('id', consultation.doctor_id).single()).data
    : null
  const vitalSign = consultation.vital_sign_id
    ? (await supabase.from('vital_signs').select('*').eq('id', consultation.vital_sign_id).single()).data
    : null

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('consultation_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  return apiSuccess({
    ...consultation,
    patient,
    nurse,
    doctor,
    vital_sign: vitalSign,
    messages: messages ?? [],
  })
}

/**
 * PATCH /api/consultations/[id] — Doctor claim/close, admin update.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'doctor' && profile.role !== 'admin') return apiError('Forbidden', 403)

  const body = await request.json()
  const parsed = updateConsultationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { data: current } = await supabase.from('consultations').select('*').eq('id', id).single()
  if (!current) return apiError('Konsultasi tidak ditemukan', 404)

  const { data, error } = await supabase
    .from('consultations')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal memperbarui konsultasi', 500)

  if (parsed.data.doctor_id && !current.doctor_id) {
    await createNotification({
      userId: current.nurse_id,
      type: 'consultation_claimed',
      title: 'Konsultasi Diambil',
      body: `Dr. ${profile.full_name} telah mengambil konsultasi Anda`,
      link: `/nurse/patients`,
    })
    await logAudit({
      userId: profile.id,
      action: 'CLAIM_CONSULTATION',
      targetTable: 'consultations',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    })
  }

  if (parsed.data.status === 'closed') {
    await createNotification({
      userId: current.nurse_id,
      type: 'consultation_closed',
      title: 'Konsultasi Selesai',
      body: `Dr. ${profile.full_name} telah menutup konsultasi`,
      link: `/nurse/patients`,
    })
    await logAudit({
      userId: profile.id,
      action: 'CLOSE_CONSULTATION',
      targetTable: 'consultations',
      targetId: id,
      details: { closing_notes: parsed.data.closing_notes, referral_needed: parsed.data.referral_needed },
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    })
  }

  return apiSuccess(data)
}
