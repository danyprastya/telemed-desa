// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { createVitalSignSchema } from '@/lib/validations/vitals.schema'
import { evaluateVitalSigns } from '@/lib/utils/vitals.utils'

/**
 * GET /api/patients/[id]/vitals — Paginated vital sign history.
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
  const limit = parseInt(url.searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  const { data, count, error } = await supabase
    .from('vital_signs')
    .select('*', { count: 'exact' })
    .eq('patient_id', id)
    .order('recorded_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError('Gagal mengambil data tanda vital', 500)

  return apiSuccess({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

/**
 * POST /api/patients/[id]/vitals — Record new vital signs. Nurse only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'nurse') return apiError('Forbidden: nurses only', 403)

  const body = await request.json()
  const parsed = createVitalSignSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { is_flagged, flag_reasons } = evaluateVitalSigns({
    temperature: parsed.data.temperature,
    heart_rate: parsed.data.heart_rate,
    spo2: parsed.data.spo2,
    systolic_bp: parsed.data.systolic_bp ?? undefined,
  })

  const { data, error } = await supabase
    .from('vital_signs')
    .insert({
      patient_id: id,
      temperature: parsed.data.temperature,
      heart_rate: parsed.data.heart_rate,
      spo2: parsed.data.spo2,
      systolic_bp: parsed.data.systolic_bp ?? null,
      diastolic_bp: parsed.data.diastolic_bp ?? null,
      is_flagged,
      flag_reasons,
      recorded_by: profile.id,
    })
    .select()
    .single()

  if (error) return apiError('Gagal menyimpan tanda vital', 500)

  await logAudit({
    userId: profile.id,
    action: 'CREATE_VITAL_SIGN',
    targetTable: 'vital_signs',
    targetId: data.id,
    details: { patient_id: id, is_flagged },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(data, 201)
}
