// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
})

/**
 * PATCH /api/admin/puskesmas/[id] — Update a Puskesmas. Admin only.
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
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { data, error } = await supabase
    .from('puskesmas')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError('Gagal memperbarui puskesmas', 500)
  return apiSuccess(data)
}

/**
 * DELETE /api/admin/puskesmas/[id] — Only if no assigned nurses.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'admin') return apiError('Forbidden: admin only', 403)

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('puskesmas_id', id)
    .eq('is_active', true)

  if (count && count > 0) {
    return apiError('Tidak dapat menghapus puskesmas yang masih memiliki perawat aktif', 409)
  }

  const { error } = await supabase.from('puskesmas').delete().eq('id', id)
  if (error) return apiError('Gagal menghapus puskesmas', 500)
  return apiSuccess({ deleted: true })
}
