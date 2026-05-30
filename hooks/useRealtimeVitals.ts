'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
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
  const [isConnecting, setIsConnecting] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [reconnectCounter, setReconnectCounter] = useState(0)
  const manualReconnectRef = useRef(false)
  const supabase = createClient()

  const reconnect = () => {
    setIsConnecting(true)
    manualReconnectRef.current = true
    setReconnectCounter((c) => c + 1)
  }

  // Sync initial vitals
  useEffect(() => {
    setVitals(initialVitals)
    if (initialVitals.length > 0) {
      setLastUpdated(new Date(initialVitals[0].recorded_at))
    }
  }, [initialVitals])

  // Subscribe to new vital sign inserts
  useEffect(() => {
    setIsConnecting(true)
    const channel = supabase
      .channel(`vitals:${patientId}:${reconnectCounter}`)
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
      .subscribe((status, err) => {
        setIsLive(status === 'SUBSCRIBED')
        setIsConnecting(false)
        
        if (manualReconnectRef.current) {
          if (status === 'SUBSCRIBED') {
            toast.success('Koneksi monitoring berhasil dipulihkan')
            manualReconnectRef.current = false
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            toast.error('Gagal memulihkan koneksi monitoring')
            manualReconnectRef.current = false
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId, supabase, reconnectCounter])

  return { vitals, isLive, isConnecting, lastUpdated, reconnect }
}
