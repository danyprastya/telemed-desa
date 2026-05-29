'use client'

import { useNotifications } from '@/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef } from 'react'

interface NotificationDropdownProps {
  /** Callback to close the dropdown */
  onClose: () => void
}

/**
 * Dropdown panel showing recent notifications.
 * Renders below the NotificationBell with a list of NotificationItems.
 */
export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead } = useNotifications()
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
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-border-green shadow-lg z-50"
    >
      <div className="px-4 py-3 border-b border-border-green">
        <h3 className="text-sm font-semibold text-text-primary">Notifikasi</h3>
      </div>
      <ScrollArea className="max-h-[400px]">
        {notifications.length === 0 ? (
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
      </ScrollArea>
    </div>
  )
}
