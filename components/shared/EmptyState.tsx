import { LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  /** Icon to display (defaults to Inbox) */
  icon?: LucideIcon
  /** Main message */
  title: string
  /** Optional description */
  description?: string
  /** Optional action button label */
  actionLabel?: string
  /** Optional action button click handler */
  onAction?: () => void
}

/**
 * Reusable empty state component displayed when a list has no items.
 * Provides a clear visual cue and optional call-to-action.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-surface p-4 mb-4">
        <Icon className="h-10 w-10 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
