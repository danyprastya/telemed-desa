import type { VitalStatus } from '@/lib/utils/vitals.utils'

interface VitalSignBadgeProps {
  status: VitalStatus
  label?: string
  className?: string
}

const STATUS_STYLES: Record<VitalStatus, string> = {
  normal: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  critical: 'bg-critical-light text-critical',
}

const STATUS_LABELS: Record<VitalStatus, string> = {
  normal: 'Normal',
  warning: 'Perhatian',
  critical: 'Kritis',
}

/**
 * Colored badge indicating vital sign clinical status.
 * Green for normal, amber for warning, red for critical.
 * @param status - The vital sign clinical status.
 * @param className - Optional additional classes.
 */
export function VitalSignBadge({ status, label, className = '' }: VitalSignBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${status === 'normal' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-critical'}`} />
      {label ? <span className="mr-1">{label}:</span> : null}
      {STATUS_LABELS[status]}
    </span>
  )
}
