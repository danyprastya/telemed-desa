'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types/app.types'

/**
 * Hook for managing notifications with real-time updates.
 * Subscribes to INSERT events on the notifications table for the current user.
 * @returns Notification state and actions.
 */
export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  /** Fetch initial notifications */
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch('/api/notifications?limit=20')
      const result = await response.json()
      if (result.data?.items) {
        setNotifications(result.data.items)
        setUnreadCount(result.data.items.filter((n: Notification) => !n.is_read).length)
      }
    } catch (error) {
      console.error('[useNotifications] Failed to fetch:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  /** Mark a notification as read */
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('[useNotifications] Failed to mark as read:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  /** Subscribe to real-time notification inserts */
  useEffect(() => {
    if (!user) return

    const channelName = `notifications:${user.id}:${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return { notifications, unreadCount, markAsRead, isLoading }
}
