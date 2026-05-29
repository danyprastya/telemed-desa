'use client'

import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils/format.utils'
import type { Message } from '@/types/app.types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

/**
 * Renders a single chat message bubble.
 * Own messages align right with green background.
 * Other messages align left with gray background.
 * @param message - The message record.
 * @param isOwn - Whether this message was sent by the current user.
 */
export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-3 py-2',
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-muted text-text-primary rounded-bl-sm border border-border-green'
        )}
      >
        {!isOwn && (
          <p className="text-xs font-medium text-primary mb-0.5">
            {message.sender?.full_name ?? 'Unknown'}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isOwn ? 'text-white/70' : 'text-text-muted'
          )}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
