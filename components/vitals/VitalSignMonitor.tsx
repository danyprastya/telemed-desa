'use client'

import { useEffect, useState, useRef } from 'react'
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals'
import { VitalSignChart } from '@/components/vitals/VitalSignChart'
import { VitalSignBadge } from '@/components/vitals/VitalSignBadge'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getVitalStatus, type VitalType } from '@/lib/utils/vitals.utils'
import { formatDateTime } from '@/lib/utils/format.utils'
import { Activity, Wifi, WifiOff, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import type { VitalSign } from '@/types/app.types'

interface VitalSignMonitorProps {
  patientId: string
  initialVitals: VitalSign[]
}

/**
 * Real-time vital sign monitoring panel with live updates via Supabase Realtime.
 * Shows LIVE/DISCONNECTED badge, last-updated timestamp,
 * four trend charts, and flag alerts for critical readings.
 * @param patientId - The patient being monitored.
 * @param initialVitals - Vital signs fetched on mount (newest first).
 */
export function VitalSignMonitor({ patientId, initialVitals }: VitalSignMonitorProps) {
  const { vitals, isLive, isConnecting, lastUpdated, reconnect } = useRealtimeVitals(patientId, initialVitals)
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Calculate absolute time difference every second
  useEffect(() => {
    const updateDiff = () => {
      const now = new Date().getTime()
      const diff = Math.floor((now - lastUpdated.getTime()) / 1000)
      setSecondsSinceUpdate(diff >= 0 ? diff : 0)
    }
    updateDiff() // call immediately
    
    intervalRef.current = setInterval(updateDiff, 1000)
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [lastUpdated])

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return `${seconds} detik`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam ${Math.floor((seconds % 3600) / 60)} menit`
    return `${Math.floor(seconds / 86400)} hari`
  }

  if (vitals.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <Activity className="mx-auto h-8 w-8 mb-2" />
        <p className="text-sm">Belum ada data tanda vital untuk dimonitor.</p>
      </div>
    )
  }

  // Prepare chart data (chronological order)
  const chartData = [...vitals].reverse().map((v) => ({
    time: formatDateTime(v.recorded_at),
    temperature: v.temperature,
    heartRate: v.heart_rate,
    spo2: v.spo2,
    systolicBp: v.systolic_bp ?? undefined,
    diastolicBp: v.diastolic_bp ?? undefined,
  }))

  const temperatureStatuses = chartData.map((d) => getVitalStatus('temperature', d.temperature))
  const heartRateStatuses = chartData.map((d) => getVitalStatus('heart_rate', d.heartRate))
  const spo2Statuses = chartData.map((d) => getVitalStatus('spo2', d.spo2))
  const bpStatuses = chartData
    .filter((d) => d.systolicBp !== undefined)
    .map((d) => getVitalStatus('systolic_bp', d.systolicBp!))

  const hasBpData = chartData.some((d) => d.systolicBp !== undefined)
  const latest = vitals[0]
  const latestStatuses: { type: VitalType; label: string; value: string; status: ReturnType<typeof getVitalStatus> }[] = [
    { type: 'temperature', label: 'Suhu', value: `${latest.temperature}°C`, status: getVitalStatus('temperature', latest.temperature) },
    { type: 'heart_rate', label: 'Nadi', value: `${latest.heart_rate} bpm`, status: getVitalStatus('heart_rate', latest.heart_rate) },
    { type: 'spo2', label: 'SpO₂', value: `${latest.spo2}%`, status: getVitalStatus('spo2', latest.spo2) },
  ]
  if (latest.systolic_bp) {
    latestStatuses.push({
      type: 'systolic_bp',
      label: 'TD',
      value: `${latest.systolic_bp}/${latest.diastolic_bp}`,
      status: getVitalStatus('systolic_bp', latest.systolic_bp),
    })
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border-green bg-surface">
        <div className="flex items-center gap-3">
          {isLive ? (
            <Badge className="bg-success-light text-success gap-1 animate-pulse-live">
              <Wifi className="h-3 w-3" /> LIVE
            </Badge>
          ) : isConnecting ? (
            <Badge className="bg-warning-light text-warning gap-1">
              <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> MENYAMBUNGKAN
            </Badge>
          ) : (
            <button 
              onClick={reconnect}
              className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
              title="Klik untuk menyambungkan kembali"
            >
              <Badge className="bg-critical-light text-critical gap-1 cursor-pointer">
                <RefreshCw className="h-3 w-3 mr-0.5" /> RECONNECT
              </Badge>
            </button>
          )}
          <span className="text-xs text-text-muted">
            Terakhir diperbarui: {formatTimeAgo(secondsSinceUpdate)} lalu
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {latestStatuses.map((s) => (
            <VitalSignBadge key={s.type} status={s.status} label={s.label} />
          ))}
        </div>
      </div>

      {/* Flagged alert */}
      {latest.is_flagged && latest.flag_reasons && latest.flag_reasons.length > 0 && (
        <Alert className="border-critical/30 bg-critical-light/50">
          <AlertTriangle className="h-4 w-4 text-critical" />
          <AlertDescription>
            <ul className="list-disc list-inside text-sm text-critical">
              {latest.flag_reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Latest values summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {latestStatuses.map((s) => (
          <div key={s.type} className="p-3 rounded-lg border border-border-green bg-white text-center">
            <p className="text-xs text-text-secondary">{s.label}</p>
            <p className="text-lg font-bold text-text-primary">{s.value}</p>
            <VitalSignBadge status={s.status} className="mt-1" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VitalSignChart
          title="Suhu Tubuh"
          data={chartData}
          dataKey="temperature"
          unit="°C"
          statuses={temperatureStatuses}
          normalLow={36.1}
          normalHigh={37.2}
        />
        <VitalSignChart
          title="Denyut Nadi"
          data={chartData}
          dataKey="heartRate"
          unit="bpm"
          statuses={heartRateStatuses}
          normalLow={60}
          normalHigh={100}
        />
        <VitalSignChart
          title="SpO₂"
          data={chartData}
          dataKey="spo2"
          unit="%"
          statuses={spo2Statuses}
          normalLow={95}
          normalHigh={100}
        />
        {hasBpData && (
          <VitalSignChart
            title="Tekanan Darah Sistolik"
            data={chartData.filter((d) => d.systolicBp !== undefined)}
            dataKey="systolicBp"
            unit="mmHg"
            statuses={bpStatuses}
            normalLow={91}
            normalHigh={120}
          />
        )}
      </div>
    </div>
  )
}
