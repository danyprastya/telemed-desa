'use client'

import { useEffect } from 'react'
import { useVitalSigns } from '@/hooks/useVitalSigns'
import { VitalSignBadge } from '@/components/vitals/VitalSignBadge'
import { VitalSignChart } from '@/components/vitals/VitalSignChart'
import { Pagination } from '@/components/shared/Pagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime, formatDate } from '@/lib/utils/format.utils'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle } from 'lucide-react'
import type { VitalSign } from '@/types/app.types'
import { getVitalStatus, type VitalType } from '@/lib/utils/vitals.utils'

interface VitalSignHistoryProps {
  patientId: string
  showCharts?: boolean
}

/**
 * Paginated vital sign history component with optional trend charts.
 * Renders a list of vital sign readings and optional Recharts line charts.
 * @param patientId - The patient whose vitals to display.
 * @param showCharts - Whether to show trend charts above the history list.
 */
export function VitalSignHistory({ patientId, showCharts = false }: VitalSignHistoryProps) {
  const {
    vitals,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setPage,
    refresh,
  } = useVitalSigns(patientId, 20)

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

  if (vitals.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Belum ada data tanda vital"
        description="Rekam tanda vital pasien untuk melihat riwayat di sini."
      />
    )
  }

  // Prepare chart data (reversed to chronological order for charts)
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

  return (
    <div className="space-y-6">
      {showCharts && (
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
      )}

      <div className="space-y-3">
        {vitals.map((vital) => (
          <VitalHistoryItem key={vital.id} vital={vital} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}

function VitalHistoryItem({ vital }: { vital: VitalSign }) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        vital.is_flagged ? 'border-critical/30 bg-critical-light/30' : 'border-border-green bg-surface'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary">{formatDate(vital.recorded_at)}</span>
        {vital.is_flagged && (
          <Badge className="bg-critical-light text-critical text-xs gap-1">
            <AlertTriangle className="h-3 w-3" /> Ditandai
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-2 rounded-md bg-white border border-border-green">
          <span className="text-text-secondary text-xs block">Suhu</span>
          <span className="font-semibold">{vital.temperature}°C</span>
        </div>
        <div className="p-2 rounded-md bg-white border border-border-green">
          <span className="text-text-secondary text-xs block">Nadi</span>
          <span className="font-semibold">{vital.heart_rate} bpm</span>
        </div>
        <div className="p-2 rounded-md bg-white border border-border-green">
          <span className="text-text-secondary text-xs block">SpO₂</span>
          <span className="font-semibold">{vital.spo2}%</span>
        </div>
        {vital.systolic_bp && (
          <div className="p-2 rounded-md bg-white border border-border-green">
            <span className="text-text-secondary text-xs block">TD</span>
            <span className="font-semibold">{vital.systolic_bp}/{vital.diastolic_bp}</span>
          </div>
        )}
      </div>
      {vital.flag_reasons && vital.flag_reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {vital.flag_reasons.map((reason, i) => (
            <li key={i} className="text-xs text-critical flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
