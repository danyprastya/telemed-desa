import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  /** Card title */
  title: string
  /** Stat value */
  value: number | string
  /** Card icon */
  icon: LucideIcon
  /** Optional description */
  description?: string
  /** Card accent color class */
  colorClass?: string
}

/**
 * Admin dashboard statistics card.
 * Displays a stat value with icon and title.
 */
export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass = 'bg-primary-light text-primary',
}: StatsCardProps) {
  return (
    <Card className="border-border-green">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
            {description && (
              <p className="text-xs text-text-muted mt-1">{description}</p>
            )}
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
