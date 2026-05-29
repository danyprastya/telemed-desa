'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VitalSign } from '@/types/app.types'

/**
 * Hook for real-time vital sign updates via Supabase Realtime.
 * Subscribes to INSERT events on vital_signs filtered by patient_id.
 * @param patientId - The patient to monitor.
 * @param initialVitals - Vitals fetched on mount (newest first).
 * @returns { vitals, isLive, lastUpdated }
 */
export function useRealtimeVitals(patientId: string, initialVitals: VitalSign[]) {
  const [vitals, setVitals] = useState<VitalSign[]>(initialVitals)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const supabase = createClient()

  // Sync initial vitals
  useEffect(() => {
    setVitals(initialVitals)
    if (initialVitals.length > 0) {
      setLastUpdated(new Date(initialVitals[0].recorded_at))
    }
  }, [initialVitals])

  // Subscribe to new vital sign inserts
  useEffect(() => {
    const channel = supabase
      .channel(`vitals:${patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_signs',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const newVital = payload.new as VitalSign
          setVitals((prev) => {
            // Prepend (newest first), limit to 20
            const updated = [newVital, ...prev].slice(0, 20)
            return updated
          })
          setLastUpdated(new Date())
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      channel.unsubscribe()
    }
  }, [patientId, supabase])

  return { vitals, isLive, lastUpdated }
}
