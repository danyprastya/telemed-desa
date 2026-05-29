'use client'

import { useState, useCallback } from 'react'
import type { VitalSign } from '@/types/app.types'

interface UseVitalSignsReturn {
  vitals: VitalSign[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  setPage: (val: number) => void
  refresh: () => Promise<void>
}

/**
 * Hook for managing paginated vital sign history for a patient.
 * @param patientId - The patient whose vitals to fetch.
 * @param limit - Items per page (default 20).
 * @returns Vital sign list state and control functions.
 */
export function useVitalSigns(patientId: string, limit = 20): UseVitalSignsReturn {
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const refresh = useCallback(async () => {
    if (!patientId) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/patients/${patientId}/vitals?${params.toString()}`)
      const result = await res.json()

      if (result.error) {
        setError(result.error)
        setVitals([])
        setTotal(0)
      } else {
        setVitals(result.data?.items ?? [])
        setTotal(result.data?.total ?? 0)
      }
    } catch {
      setError('Gagal mengambil data tanda vital')
      setVitals([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [patientId, page, limit])

  return { vitals, total, page, totalPages, isLoading, error, setPage, refresh }
}
