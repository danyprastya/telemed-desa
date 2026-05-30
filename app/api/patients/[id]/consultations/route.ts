// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { createNotification, createBulkNotifications } from '@/lib/utils/notifications.utils'
import { createConsultationSchema } from '@/lib/validations/consultation.schema'

/**
 * POST /api/patients/[id]/consultations — Create consultation. Nurse only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: patientId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'nurse') return apiError('Forbidden: nurses only', 403)

  const body = await request.json()
  const parsed = createConsultationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { data: patient } = await supabase.from('patients').select('full_name').eq('id', patientId).single()

  const { data: consultation, error } = await supabase
    .from('consultations')
    .insert({
      patient_id: patientId,
      nurse_id: profile.id,
      doctor_id: parsed.data.doctor_id,
      vital_sign_id: parsed.data.vital_sign_id ?? null,
    })
    .select()
    .single()

  if (error) return apiError('Gagal membuat konsultasi', 500)

  if (parsed.data.initial_message) {
    await supabase.from('messages').insert({
      consultation_id: consultation.id,
      sender_id: profile.id,
      content: parsed.data.initial_message,
    })
  }

  // Notify only the assigned doctor
  await createNotification({
    userId: parsed.data.doctor_id,
    type: 'new_consultation',
    title: 'Konsultasi Baru',
    body: `${profile.full_name} menugaskan konsultasi pasien ${patient?.full_name ?? 'Unknown'} kepada Anda`,
    link: `/doctor/consultations/${consultation.id}`,
  })

  await logAudit({
    userId: profile.id,
    action: 'CREATE_CONSULTATION',
    targetTable: 'consultations',
    targetId: consultation.id,
    details: { patient_id: patientId },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(consultation, 201)
}
