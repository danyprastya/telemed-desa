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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single() as { data: any; error: any }
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'nurse') return apiError('Forbidden: nurses only', 403)

  const body = await request.json()
  const parsed = createConsultationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  // Get patient name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patient } = await supabase.from('patients').select('full_name').eq('id', patientId).single() as { data: any; error: any }

  const { data: consultation, error } = await supabase
    .from('consultations')
    .insert({
      patient_id: patientId,
      nurse_id: profile.id,
      vital_sign_id: parsed.data.vital_sign_id ?? null,
    } as any)
    .select()
    .single()

  if (error) return apiError('Gagal membuat konsultasi', 500)

  // Insert initial message if provided
  if (parsed.data.initial_message) {
    await supabase.from('messages').insert({
      consultation_id: (consultation as any).id,
      sender_id: profile.id,
      content: parsed.data.initial_message,
    } as any)
  }

  // Notify all active doctors
  const { data: doctors } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'doctor')
    .eq('is_active', true)

  if (doctors && doctors.length > 0) {
    await createBulkNotifications(
      doctors.map((d: any) => d.id),
      {
        type: 'new_consultation',
        title: 'Konsultasi Baru',
        body: `${profile.full_name} meminta konsultasi untuk pasien ${patient?.full_name ?? 'Unknown'}`,
        link: `/doctor/consultations/${(consultation as any).id}`,
      }
    )
  }

  await logAudit({
    userId: profile.id,
    action: 'CREATE_CONSULTATION',
    targetTable: 'consultations',
    targetId: (consultation as any).id,
    details: { patient_id: patientId },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(consultation, 201)
}
