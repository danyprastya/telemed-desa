'use client'

import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils/format.utils'
import { MessageSquare, Stethoscope, UserCheck, CheckCircle2 } from 'lucide-react'
import type { Notification } from '@/types/app.types'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  /** The notification data */
  notification: Notification
  /** Callback to mark this notification as read */
  onMarkAsRead: () => void
  /** Callback to close the dropdown */
  onClose: () => void
}

const NOTIFICATION_ICONS = {
  new_consultation: Stethoscope,
  new_message: MessageSquare,
  consultation_claimed: UserCheck,
  consultation_closed: CheckCircle2,
}

/**
 * Single notification row with icon, title, body, time, and mark-as-read.
 */
export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const router = useRouter()
  const Icon = NOTIFICATION_ICONS[notification.type] || MessageSquare

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead()
    }
    if (notification.link) {
      router.push(notification.link)
    }
    onClose()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface',
        !notification.is_read && 'bg-primary-light/30'
      )}
    >
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5',
        !notification.is_read ? 'bg-primary-light text-primary' : 'bg-surface text-text-muted'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-tight',
          !notification.is_read ? 'font-semibold text-text-primary' : 'text-text-secondary'
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-text-muted mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </button>
  )
}
