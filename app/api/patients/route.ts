import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { createPatientSchema } from '@/lib/validations/patient.schema'

/**
 * GET /api/patients
 * Paginated patient list. Role-filtered by RLS.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, puskesmas_id')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '10')
  const search = url.searchParams.get('search')
  const offset = (page - 1) * limit

  let query = supabase
    .from('patients')
    .select('*, puskesmas:puskesmas_id(name)', { count: 'exact' })
    .eq('is_deleted', false)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError('Gagal mengambil data pasien', 500)

  return apiSuccess({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

/**
 * POST /api/patients
 * Create a new patient. Nurse only.
 * Server sets puskesmas_id from the nurse's profile.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active, puskesmas_id')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'nurse') return apiError('Forbidden: nurses only', 403)
  if (!profile.puskesmas_id) return apiError('Perawat belum ditugaskan ke puskesmas', 400)

  const body = await request.json()
  const parsed = createPatientSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  const { data, error } = await supabase
    .from('patients')
    .insert({
      ...parsed.data,
      puskesmas_id: profile.puskesmas_id,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('unique') || error.code === '23505') {
      return apiError('NIK atau nomor rekam medis sudah terdaftar', 409)
    }
    return apiError('Gagal mendaftarkan pasien', 500)
  }

  await logAudit({
    userId: profile.id,
    action: 'CREATE_PATIENT',
    targetTable: 'patients',
    targetId: data.id,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(data, 201)
}
