import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { createNotification } from '@/lib/utils/notifications.utils'
import { createMessageSchema } from '@/lib/validations/message.schema'

/**
 * GET /api/consultations/[id]/messages
 * Paginated message history, ascending order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '50')
  const offset = (page - 1) * limit

  const { data, count, error } = await supabase
    .from('messages')
    .select('*, sender:sender_id(id, full_name, role)', { count: 'exact' })
    .eq('consultation_id', id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return apiError('Gagal mengambil pesan', 500)

  return apiSuccess({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

/**
 * POST /api/consultations/[id]/messages
 * Send a message. Participants only. Consultation must not be closed.
 */
export async function POST(
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

  // Check consultation status and participant access
  const { data: consultation } = await supabase
    .from('consultations')
    .select('nurse_id, doctor_id, status')
    .eq('id', id)
    .single()

  if (!consultation) return apiError('Konsultasi tidak ditemukan', 404)
  if (consultation.status === 'closed') {
    return apiError('Tidak dapat mengirim pesan ke konsultasi yang sudah ditutup', 409)
  }
  if (consultation.nurse_id !== profile.id && consultation.doctor_id !== profile.id) {
    return apiError('Anda bukan peserta konsultasi ini', 403)
  }

  const body = await request.json()
  const parsed = createMessageSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      consultation_id: id,
      sender_id: profile.id,
      content: parsed.data.content,
    })
    .select('*, sender:sender_id(id, full_name, role)')
    .single()

  if (error) return apiError('Gagal mengirim pesan', 500)

  // Notify the other participant
  const otherParticipantId = profile.id === consultation.nurse_id
    ? consultation.doctor_id
    : consultation.nurse_id

  if (otherParticipantId) {
    await createNotification({
      userId: otherParticipantId,
      type: 'new_message',
      title: 'Pesan Baru',
      body: `${profile.full_name}: ${parsed.data.content.substring(0, 100)}`,
      link: profile.role === 'nurse'
        ? `/doctor/consultations/${id}`
        : `/nurse/patients`,
    })
  }

  return apiSuccess(message, 201)
}
