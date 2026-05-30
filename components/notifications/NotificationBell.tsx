'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationDropdown } from './NotificationDropdown'
import { useState, useEffect, useRef } from 'react'

/**
 * Bell icon button with unread count badge.
 * Animates (shake) when a new notification arrives.
 * On click: opens the NotificationDropdown.
 */
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, isLoading } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const [shake, setShake] = useState(false)
  const prevCount = useRef(unreadCount)

  // Trigger shake animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 600)
      return () => clearTimeout(timer)
    }
    prevCount.current = unreadCount
  }, [unreadCount])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative ${shake ? 'animate-bell-shake' : ''}`}
        id="notification-bell"
      >
        <Bell className="h-5 w-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-critical text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifikasi</span>
      </Button>

      {showDropdown && (
        <NotificationDropdown 
          notifications={notifications}
          markAsRead={markAsRead}
          isLoading={isLoading}
          onClose={() => setShowDropdown(false)} 
        />
      )}
    </div>
  )
}
