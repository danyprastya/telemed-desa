'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Consultation } from '@/types/app.types'

/**
 * Hook for real-time consultation queue updates.
 * Subscribes to INSERT and UPDATE events on consultations table.
 * @param filters - Optional status filter.
 * @returns { consultations, isLive }
 */
export function useRealtimeConsultations(filters?: { status?: string }) {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [isLive, setIsLive] = useState(false)
  const supabase = createClient()

  // Subscribe to consultation changes
  useEffect(() => {
    const channel = supabase
      .channel('consultations:realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultations',
        },
        (payload) => {
          const newConsultation = payload.new as Consultation
          if (!filters?.status || newConsultation.status === filters.status) {
            setConsultations((prev) => [newConsultation, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultations',
        },
        (payload) => {
          const updated = payload.new as Consultation
          setConsultations((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
              .filter((c) => !filters?.status || c.status === filters.status)
          )
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, filters?.status])

  return { consultations, setConsultations, isLive }
}
