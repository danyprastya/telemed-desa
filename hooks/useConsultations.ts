'use client'

import { useState, useCallback } from 'react'
import type { Consultation } from '@/types/app.types'

interface UseConsultationsReturn {
  consultations: Consultation[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  statusFilter: string
  setStatusFilter: (val: string) => void
  setPage: (val: number) => void
  refresh: () => Promise<void>
}

/**
 * Hook for managing paginated consultation list with status filter.
 * @param limit - Items per page (default 10).
 * @returns Consultation list state and control functions.
 */
export function useConsultations(limit = 10): UseConsultationsReturn {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/consultations?${params.toString()}`)
      const result = await res.json()

      if (result.error) {
        setError(result.error)
        setConsultations([])
        setTotal(0)
      } else {
        setConsultations(result.data?.items ?? [])
        setTotal(result.data?.total ?? 0)
      }
    } catch {
      setError('Gagal mengambil data konsultasi')
      setConsultations([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, statusFilter])

  return { consultations, total, page, totalPages, isLoading, error, statusFilter, setStatusFilter, setPage, refresh }
}
