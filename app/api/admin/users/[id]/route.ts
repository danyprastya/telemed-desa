// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { logAudit } from '@/lib/utils/audit.utils'
import { updateUserSchema } from '@/lib/validations/user.schema'

/**
 * PATCH /api/admin/users/[id] — Update a user's profile. Admin only.
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
  if (profile.role !== 'admin') return apiError('Forbidden: admin only', 403)

  const body = await request.json()
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal memperbarui pengguna', 500)

  await logAudit({
    userId: profile.id,
    action: 'UPDATE_USER',
    targetTable: 'profiles',
    targetId: id,
    details: parsed.data,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(data)
}

/**
 * DELETE /api/admin/users/[id] — Deactivates the user. Admin only.
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
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'admin') return apiError('Forbidden: admin only', 403)
  if (id === profile.id) return apiError('Tidak dapat menonaktifkan akun sendiri', 409)

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal menonaktifkan pengguna', 500)

  await logAudit({
    userId: profile.id,
    action: 'DEACTIVATE_USER',
    targetTable: 'profiles',
    targetId: id,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  })

  return apiSuccess(data)
}
