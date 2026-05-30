'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts'
import type { VitalStatus } from '@/lib/utils/vitals.utils'

interface ChartDataPoint {
  time: string
  [key: string]: number | string | undefined
}

interface VitalSignChartProps {
  title: string
  data: ChartDataPoint[]
  dataKey: string
  unit: string
  statuses: VitalStatus[]
  normalLow: number
  normalHigh: number
}

const STATUS_COLORS: Record<VitalStatus, string> = {
  normal: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
}

/**
 * A single-vital-sign trend chart using Recharts LineChart.
 * Shows normal range reference lines and color-coded data points.
 * @param title - Chart title displayed as a label.
 * @param data - Array of data points with time and value.
 * @param dataKey - Key of the value in data objects.
 * @param unit - Unit string (e.g., '°C', 'bpm').
 * @param statuses - Array of VitalStatus per data point.
 * @param normalLow - Lower boundary of normal range.
 * @param normalHigh - Upper boundary of normal range.
 */
export function VitalSignChart({
  title,
  data,
  dataKey,
  unit,
  statuses,
  normalLow,
  normalHigh,
}: VitalSignChartProps) {
  return (
    <div className="p-4 rounded-xl border border-border-green bg-card">
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title} ({unit})</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-green)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border-green)',
              color: 'var(--text-primary)'
            }}
            formatter={(value) => [`${value} ${unit}`, title]}
            labelFormatter={(label) => `Waktu: ${label}`}
          />
          <ReferenceLine
            y={normalLow}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <ReferenceLine
            y={normalHigh}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#16A34A"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index } = props
              const status = statuses[index] ?? 'normal'
              const color = STATUS_COLORS[status]
              return (
                <Dot
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={color}
                  stroke={color}
                />
              )
            }}
            activeDot={{ r: 6, fill: '#16A34A', stroke: 'var(--background)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
