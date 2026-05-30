'use client'

import type { Notification } from '@/types/app.types'
import { NotificationItem } from './NotificationItem'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface NotificationDropdownProps {
  notifications: Notification[]
  markAsRead: (id: string) => void
  isLoading: boolean
  onClose: () => void
}

/**
 * Dropdown panel showing recent notifications.
 * Renders below the NotificationBell with a list of NotificationItems.
 */
export function NotificationDropdown({ notifications, markAsRead, isLoading, onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest('#notification-bell')
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-popover rounded-xl border border-border-green shadow-lg z-50 overflow-hidden flex flex-col"
    >
      <div className="px-4 py-3 border-b border-border-green bg-card shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Notifikasi</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-text-muted gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Memuat notifikasi...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">
            Belum ada notifikasi
          </div>
        ) : (
          <div className="divide-y divide-border-green">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
