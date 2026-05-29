'use client'

import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle/description */
  description?: string
  /** Optional action button label */
  actionLabel?: string
  /** Optional action button click handler */
  onAction?: () => void
  /** Optional action button icon */
  actionIcon?: LucideIcon
  /** Optional action button href (renders as link) */
  actionHref?: string
}

/**
 * Reusable page header with title, optional description, and optional action button.
 * Used at the top of every page for consistent layout.
 */
export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actionHref,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      {actionLabel && (
        <Button
          onClick={onAction}
          className="mt-3 sm:mt-0"
          {...(actionHref ? { asChild: true } : {})}
        >
          {actionHref ? (
            <a href={actionHref}>
              {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
              {actionLabel}
            </a>
          ) : (
            <>
              {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
              {actionLabel}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
