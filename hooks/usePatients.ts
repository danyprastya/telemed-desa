'use client'

import { useState, useCallback } from 'react'
import type { Patient } from '@/types/app.types'

interface UsePatientsReturn {
  patients: Patient[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  search: string
  setSearch: (val: string) => void
  setPage: (val: number) => void
  refresh: () => Promise<void>
}

/**
 * Hook for managing paginated patient list with search.
 * Handles loading, error, and empty states explicitly.
 * @param limit - Items per page (default 10).
 * @returns Patient list state and control functions.
 */
export function usePatients(limit = 10): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
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
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/patients?${params.toString()}`)
      const result = await res.json()

      if (result.error) {
        setError(result.error)
        setPatients([])
        setTotal(0)
      } else {
        setPatients(result.data?.items ?? [])
        setTotal(result.data?.total ?? 0)
      }
    } catch {
      setError('Gagal mengambil data pasien')
      setPatients([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search])

  return { patients, total, page, totalPages, isLoading, error, search, setSearch, setPage, refresh }
}
