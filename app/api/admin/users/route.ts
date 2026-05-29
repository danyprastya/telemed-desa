import { NextRequest } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { createUserSchema } from '@/lib/validations/user.schema'

/**
 * GET /api/admin/users
 * Paginated list of all user profiles. Admin only.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'admin') return apiError('Forbidden: admin only', 403)

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '10')
  const role = url.searchParams.get('role')
  const search = url.searchParams.get('search')
  const offset = (page - 1) * limit

  let query = supabase
    .from('profiles')
    .select('*, puskesmas:puskesmas_id(name), hospital:hospital_id(name)', { count: 'exact' })

  if (role) query = query.eq('role', role)
  if (search) query = query.ilike('full_name', `%${search}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError('Gagal mengambil data pengguna', 500)

  return apiSuccess({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

/**
 * POST /api/admin/users
 * Create a new auth user AND their profile atomically.
 * Admin only. Uses service role client.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'admin') return apiError('Forbidden: admin only', 403)

  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  const adminClient = createAdminSupabaseClient()

  // Step 1: Create auth user
  const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  })

  if (createAuthError) {
    if (createAuthError.message.includes('already been registered')) {
      return apiError('Email sudah terdaftar', 409)
    }
    return apiError('Gagal membuat akun: ' + createAuthError.message, 500)
  }

  // Step 2: Create profile
  const { data: newProfile, error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      puskesmas_id: parsed.data.role === 'nurse' ? parsed.data.puskesmas_id : null,
      hospital_id: parsed.data.role === 'doctor' ? parsed.data.hospital_id : null,
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return apiError('Gagal membuat profil pengguna', 500)
  }

  await logAudit({
    userId: profile.id,
    action: 'CREATE_USER',
    targetTable: 'profiles',
    targetId: newProfile.id,
    details: { email: parsed.data.email, role: parsed.data.role },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(newProfile, 201)
}
