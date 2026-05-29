import { Badge } from '@/components/ui/badge'
import type { ConsultationStatus } from '@/types/app.types'

interface StatusBadgeProps {
  /** The consultation status */
  status: ConsultationStatus
}

/**
 * Color-coded status badge for consultations.
 * - open: blue (info)
 * - in_progress: amber (warning)
 * - closed: green (success)
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<ConsultationStatus, { label: string; className: string }> = {
    open: {
      label: 'Menunggu',
      className: 'bg-info-light text-info border-info/20',
    },
    in_progress: {
      label: 'Berlangsung',
      className: 'bg-warning-light text-warning border-warning/20',
    },
    closed: {
      label: 'Selesai',
      className: 'bg-success-light text-success border-success/20',
    },
  }

  const { label, className } = config[status]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
