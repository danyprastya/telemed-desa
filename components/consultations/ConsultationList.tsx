'use client'

import { useEffect } from 'react'
import { useConsultations } from '@/hooks/useConsultations'
import { useRealtimeConsultations } from '@/hooks/useRealtimeConsultations'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'
import { Pagination } from '@/components/shared/Pagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Stethoscope } from 'lucide-react'

interface ConsultationListProps {
  /** Override the link URL for each card */
  cardHref?: (consultationId: string) => string
  /** Whether to enable real-time updates */
  enableRealtime?: boolean
}

/**
 * Paginated consultation list with status filter and optional real-time updates.
 * @param cardHref - Optional function to generate link for each card.
 * @param enableRealtime - Enable Supabase Realtime subscription for live updates.
 */
export function ConsultationList({ cardHref, enableRealtime = false }: ConsultationListProps) {
  const {
    consultations,
    total,
    page,
    totalPages,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    setPage,
    refresh,
  } = useConsultations(10)

  // Enable real-time updates when requested
  useRealtimeConsultations(
    { status: statusFilter || undefined, enabled: enableRealtime, onUpdate: refresh }
  )

  const displayedCons = consultations

  useEffect(() => {
    refresh()
  }, [refresh])

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-critical mb-4">{error}</p>
        <button onClick={refresh} className="text-primary hover:underline text-sm font-medium">
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? '')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua status</SelectItem>
            <SelectItem value="open">Menunggu</SelectItem>
            <SelectItem value="in_progress">Berlangsung</SelectItem>
            <SelectItem value="closed">Selesai</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-text-muted shrink-0">{total} konsultasi ditemukan</p>
      </div>

      {displayedCons.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="Belum ada konsultasi"
          description={statusFilter ? 'Tidak ada konsultasi dengan status yang dipilih.' : 'Belum ada konsultasi yang dibuat.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedCons.map((c) => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              href={cardHref ? cardHref(c.id) : undefined}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
