import { Loader2 } from 'lucide-react'

/**
 * Full-page centered loading spinner.
 * Used for route transitions and initial data loads.
 */
export function LoadingSpinner() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
