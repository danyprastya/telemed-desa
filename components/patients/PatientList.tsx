'use client'

import { useEffect } from 'react'
import { PatientCard } from '@/components/patients/PatientCard'
import { PatientSearch } from '@/components/patients/PatientSearch'
import { Pagination } from '@/components/shared/Pagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePatients } from '@/hooks/usePatients'
import { Users } from 'lucide-react'

interface PatientListProps {
  /** Override href for each patient card (e.g., for doctor read-only view) */
  cardHref?: (patientId: string) => string
}

/**
 * Paginated patient list with search functionality.
 * Handles loading, empty, and error states.
 * @param cardHref - Optional function to generate link for each patient card.
 */
export function PatientList({ cardHref }: PatientListProps) {
  const {
    patients,
    total,
    page,
    totalPages,
    isLoading,
    error,
    search,
    setSearch,
    setPage,
    refresh,
  } = usePatients(10)

  useEffect(() => {
    refresh()
  }, [refresh])

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-critical mb-4">{error}</p>
        <button
          onClick={refresh}
          className="text-primary hover:underline text-sm font-medium"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <PatientSearch value={search} onChange={setSearch} />
        <p className="text-sm text-text-muted shrink-0">{total} pasien ditemukan</p>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pasien"
          description={search ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Daftarkan pasien baru untuk memulai.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              href={cardHref ? cardHref(patient.id) : undefined}
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
