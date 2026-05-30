// @ts-nocheck
import { createAdminSupabaseClient } from '@/lib/supabase/server'

interface CreateNotificationParams {
  userId: string
  type: 'new_consultation' | 'new_message' | 'consultation_claimed' | 'consultation_closed'
  title: string
  body: string
  link?: string
}

/**
 * Creates an in-app notification for a user.
 * Uses the admin Supabase client to bypass RLS.
 * Must only be called from API route handlers (server-side).
 * @param params - Notification data.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const adminClient = createAdminSupabaseClient()
  const { error } = await adminClient.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
  })
  if (error) {
    // Do not throw — notification failure should not block the primary operation.
    // Log it for observability.
    console.error('[createNotification] Failed to insert notification:', error.message)
  }
}

/**
 * Creates notifications for multiple users at once.
 * Useful for notifying all doctors of a new consultation.
 * @param userIds - Array of user IDs to notify.
 * @param params - Notification data (excluding userId).
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  const adminClient = createAdminSupabaseClient()
  const records = userIds.map((userId) => ({
    user_id: userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
  }))
  const { error } = await adminClient.from('notifications').insert(records)
  if (error) {
    console.error('[createBulkNotifications] Failed to insert notifications:', error.message)
  }
}
