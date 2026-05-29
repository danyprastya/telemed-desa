import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
})

/**
 * PATCH /api/admin/hospitals/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (!profile || !profile.is_active || profile.role !== 'admin') return apiError('Forbidden', 403)

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  const { data, error } = await supabase.from('hospitals').update(parsed.data).eq('id', id).select().single()
  if (error) return apiError('Gagal memperbarui rumah sakit', 500)
  return apiSuccess(data)
}

/**
 * DELETE /api/admin/hospitals/[id]
 * Only if no assigned doctors.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (!profile || !profile.is_active || profile.role !== 'admin') return apiError('Forbidden', 403)

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('hospital_id', id)
    .eq('is_active', true)

  if (count && count > 0) {
    return apiError('Tidak dapat menghapus rumah sakit yang masih memiliki dokter aktif', 409)
  }

  const { error } = await supabase.from('hospitals').delete().eq('id', id)
  if (error) return apiError('Gagal menghapus rumah sakit', 500)
  return apiSuccess({ deleted: true })
}
