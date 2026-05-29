import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { createNotification } from '@/lib/utils/notifications.utils'
import { updateConsultationSchema } from '@/lib/validations/consultation.schema'

/**
 * GET /api/consultations/[id]
 * Consultation detail with patient, vitals, and first page of messages.
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
    .select(`
      *,
      patient:patient_id(id, full_name, nik, date_of_birth, gender, address, medical_record_no),
      nurse:nurse_id(id, full_name),
      doctor:doctor_id(id, full_name),
      vital_sign:vital_sign_id(*)
    `)
    .eq('id', id)
    .single()

  if (error || !consultation) return apiError('Konsultasi tidak ditemukan', 404)

  // Fetch first page of messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:sender_id(id, full_name, role)')
    .eq('consultation_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  return apiSuccess({ ...consultation, messages: messages ?? [] })
}

/**
 * PATCH /api/consultations/[id]
 * Update consultation. Doctor can claim, close. Admin can update all.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active, full_name')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'doctor' && profile.role !== 'admin') return apiError('Forbidden', 403)

  const body = await request.json()
  const parsed = updateConsultationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  // Get current consultation state
  const { data: current } = await supabase
    .from('consultations')
    .select('nurse_id, doctor_id, status')
    .eq('id', id)
    .single()

  if (!current) return apiError('Konsultasi tidak ditemukan', 404)

  const { data, error } = await supabase
    .from('consultations')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal memperbarui konsultasi', 500)

  // Send notifications based on what changed
  if (parsed.data.doctor_id && !current.doctor_id) {
    // Doctor claimed the consultation
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
    // Consultation was closed
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
      details: {
        closing_notes: parsed.data.closing_notes,
        referral_needed: parsed.data.referral_needed,
      },
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    })
  }

  return apiSuccess(data)
}
