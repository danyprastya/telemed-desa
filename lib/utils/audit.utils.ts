// @ts-nocheck
import { createAdminSupabaseClient } from '@/lib/supabase/server'

interface AuditParams {
  userId: string
  action: string       // e.g. 'CREATE_PATIENT', 'UPDATE_PATIENT', 'CREATE_CONSULTATION', 'CLOSE_CONSULTATION', 'CREATE_USER', 'DEACTIVATE_USER'
  targetTable: string  // e.g. 'patients', 'consultations', 'profiles'
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Writes an audit log entry. Uses the admin client to bypass RLS.
 * Must only be called from API route handlers.
 * Failures are logged but never thrown — audit failure must not break the primary operation.
 * @param params - Audit log parameters.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  const adminClient = createAdminSupabaseClient()
  const { error } = await adminClient.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    target_table: params.targetTable,
    target_id: params.targetId ?? null,
    details: params.details ?? null,
    ip_address: params.ipAddress ?? null,
  })
  if (error) {
    console.error('[logAudit] Failed to write audit log:', error.message)
  }
}
