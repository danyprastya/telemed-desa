// @ts-nocheck
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/utils/api.utils'
import { z } from 'zod'

const hospitalSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  location: z.string().min(2, 'Lokasi minimal 2 karakter'),
})

/**
 * GET /api/admin/hospitals
 * List all hospitals.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return apiError('Gagal mengambil data rumah sakit', 500)
  return apiSuccess(data)
}

/**
 * POST /api/admin/hospitals
 * Create a new hospital. Admin only.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('Unauthorized', 401)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single() as { data: any; error: any }
  if (!profile || !profile.is_active) return apiError('Forbidden', 403)
  if (profile.role !== 'admin') return apiError('Forbidden: admin only', 403)

  const body = await request.json()
  const parsed = hospitalSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)

  const { data, error } = await supabase
    .from('hospitals')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return apiError('Gagal membuat rumah sakit', 500)
  return apiSuccess(data, 201)
}
