/**
 * Clinical reference ranges for adult vital signs.
 * Based on standard clinical guidelines.
 * All thresholds are inclusive.
 */
export const VITAL_RANGES = {
  temperature: {
    critical_low: 35.0,
    warning_low: 36.0,
    normal_low: 36.1,
    normal_high: 37.2,
    warning_high: 38.0,
    critical_high: 39.5,
    unit: '°C',
    label: 'Suhu',
  },
  heart_rate: {
    critical_low: 40,
    warning_low: 55,
    normal_low: 60,
    normal_high: 100,
    warning_high: 110,
    critical_high: 130,
    unit: 'bpm',
    label: 'Denyut Nadi',
  },
  spo2: {
    critical_low: 90,
    warning_low: 94,
    normal_low: 95,
    normal_high: 100,
    unit: '%',
    label: 'SpO2',
  },
  systolic_bp: {
    critical_low: 80,
    warning_low: 90,
    normal_low: 91,
    normal_high: 120,
    warning_high: 140,
    critical_high: 180,
    unit: 'mmHg',
    label: 'Tekanan Darah Sistolik',
  },
} as const

export type VitalType = keyof typeof VITAL_RANGES
export type VitalStatus = 'normal' | 'warning' | 'critical'

/**
 * Evaluates a single vital sign value and returns its clinical status.
 * @param type - The vital sign type key.
 * @param value - The measured value.
 * @returns 'normal' | 'warning' | 'critical'
 */
export function getVitalStatus(type: VitalType, value: number): VitalStatus {
  const range = VITAL_RANGES[type]
  if ('critical_low' in range && value <= range.critical_low) return 'critical'
  if ('critical_high' in range && value >= range.critical_high) return 'critical'
  if ('warning_low' in range && value <= range.warning_low) return 'warning'
  if ('warning_high' in range && value >= range.warning_high) return 'warning'
  if (value < range.normal_low) return 'warning'
  return 'normal'
}

/**
 * Evaluates a full set of vital signs and returns flag status and reason strings.
 * Called server-side on POST /api/patients/[id]/vitals before DB insert.
 * @param vitals - Measured vital sign values.
 * @returns { is_flagged: boolean, flag_reasons: string[] }
 */
export function evaluateVitalSigns(vitals: {
  temperature: number
  heart_rate: number
  spo2: number
  systolic_bp?: number
}): { is_flagged: boolean; flag_reasons: string[] } {
  const reasons: string[] = []

  const tempStatus = getVitalStatus('temperature', vitals.temperature)
  if (tempStatus === 'critical') reasons.push(`Suhu kritis: ${vitals.temperature}°C`)
  else if (tempStatus === 'warning') reasons.push(`Suhu tidak normal: ${vitals.temperature}°C`)

  const spo2Status = getVitalStatus('spo2', vitals.spo2)
  if (spo2Status === 'critical') reasons.push(`SpO2 kritis: ${vitals.spo2}%`)
  else if (spo2Status === 'warning') reasons.push(`SpO2 borderline: ${vitals.spo2}%`)

  const hrStatus = getVitalStatus('heart_rate', vitals.heart_rate)
  if (hrStatus === 'critical') reasons.push(`Denyut nadi kritis: ${vitals.heart_rate} bpm`)
  else if (hrStatus === 'warning') reasons.push(`Denyut nadi tidak normal: ${vitals.heart_rate} bpm`)

  if (vitals.systolic_bp !== undefined) {
    const bpStatus = getVitalStatus('systolic_bp', vitals.systolic_bp)
    if (bpStatus === 'critical') reasons.push(`Tekanan darah kritis: ${vitals.systolic_bp} mmHg`)
    else if (bpStatus === 'warning') reasons.push(`Tekanan darah tidak normal: ${vitals.systolic_bp} mmHg`)
  }

  return { is_flagged: reasons.length > 0, flag_reasons: reasons }
}
