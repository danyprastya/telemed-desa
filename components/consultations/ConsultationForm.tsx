'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createConsultationSchema, type CreateConsultationInput } from '@/lib/validations/consultation.schema'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VitalSign } from '@/types/app.types'

interface ConsultationFormProps {
  patientId: string
  onSuccess?: (consultationId: string) => void
}

/**
 * Form for creating a new consultation for a patient.
 * Nurse selects an optional linked vital sign and writes an initial message.
 * @param patientId - The patient to create a consultation for.
 * @param onSuccess - Optional callback with the new consultation ID.
 */
export function ConsultationForm({ patientId, onSuccess }: ConsultationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [loadingVitals, setLoadingVitals] = useState(true)
  const [doctors, setDoctors] = useState<{id: string, full_name: string}[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  const STORAGE_KEY = `consultation_draft_${patientId}`

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateConsultationInput>({
    resolver: zodResolver(createConsultationSchema),
    defaultValues: {
      doctor_id: '',
      vital_sign_id: 'none',
      initial_message: '',
    },
  })

  // Auto-save: load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.doctor_id) setValue('doctor_id', parsed.doctor_id)
        if (parsed.vital_sign_id) setValue('vital_sign_id', parsed.vital_sign_id)
        if (parsed.initial_message) setValue('initial_message', parsed.initial_message)
      } catch (e) {
        console.error('Failed to parse draft', e)
      }
    }
  }, [STORAGE_KEY, setValue])

  const selectedVitalId = watch('vital_sign_id')
  const currentValues = watch()

  // Auto-save: save draft on change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentValues))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [currentValues, STORAGE_KEY])

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await fetch(`/api/patients/${patientId}/vitals?limit=20`)
        const result = await res.json()
        if (result.data?.items) setVitals(result.data.items)
      } catch {
        toast.error('Gagal mengambil data tanda vital')
      } finally {
        setLoadingVitals(false)
      }
    }
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/doctors')
        const result = await res.json()
        if (result.data) setDoctors(result.data)
      } catch {
        toast.error('Gagal mengambil data dokter')
      } finally {
        setLoadingDoctors(false)
      }
    }
    fetchVitals()
    fetchDoctors()
  }, [patientId])

  const selectedDoctorId = watch('doctor_id')

  const onSubmit = async (data: CreateConsultationInput) => {
    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = { doctor_id: data.doctor_id }
      if (data.vital_sign_id && data.vital_sign_id !== 'none') body.vital_sign_id = data.vital_sign_id
      if (data.initial_message?.trim()) body.initial_message = data.initial_message.trim()

      const res = await fetch(`/api/patients/${patientId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Konsultasi berhasil dibuat')
        localStorage.removeItem(STORAGE_KEY)
        
        if (onSuccess) {
          onSuccess(result.data?.id)
        } else {
          router.push(`/nurse/patients/${patientId}`)
        }
      }
    } catch {
      toast.error('Gagal membuat konsultasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <Card className="border-border-green">
        <CardHeader>
          <CardTitle className="text-lg">Buat Konsultasi Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctor_id">Dokter Tujuan <span className="text-critical">*</span></Label>
            <Select
              value={selectedDoctorId ?? ''}
              onValueChange={(val) => setValue('doctor_id', val as string, { shouldValidate: true })}
              disabled={isSubmitting || loadingDoctors}
            >
              <SelectTrigger id="doctor_id" className={errors.doctor_id ? 'border-critical' : ''}>
                <SelectValue placeholder={loadingDoctors ? 'Memuat data dokter...' : 'Pilih dokter spesialis atau umum'}>
                  {selectedDoctorId ? `${doctors.find(d => d.id === selectedDoctorId)?.full_name}` : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.doctor_id && <p className="text-xs text-critical">{errors.doctor_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vital_sign_id">Data Tanda Vital Terkait (opsional)</Label>
            <Select
              value={selectedVitalId ?? ''}
              onValueChange={(val) => setValue('vital_sign_id', val as string || null)}
              disabled={isSubmitting || loadingVitals}
            >
              <SelectTrigger id="vital_sign_id">
                <SelectValue placeholder={loadingVitals ? 'Memuat data...' : 'Pilih data tanda vital'}>
                  {selectedVitalId 
                    ? (() => {
                        const v = vitals.find(v => v.id === selectedVitalId);
                        return v ? `${new Date(v.recorded_at).toLocaleDateString('id-ID')} — Suhu: ${v.temperature}°C` : null;
                      })()
                    : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="none">Tidak ada</SelectItem>
                {vitals.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="whitespace-normal h-auto py-2">
                    <div className="flex flex-col gap-1 items-start text-left w-full pr-4">
                      <div className="font-medium text-sm">
                        {new Date(v.recorded_at).toLocaleString('id-ID')} {v.is_flagged ? '⚠️' : ''}
                      </div>
                      <div className="text-xs text-text-secondary leading-tight text-wrap">
                        TD: {v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : '-'} | Nadi: {v.heart_rate || '-'} bpm
                      </div>
                      <div className="text-xs text-text-secondary leading-tight text-wrap">
                        Suhu: {v.temperature || '-'}°C | SpO₂: {v.spo2 || '-'}%
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial_message">Pesan Awal (opsional)</Label>
            <Textarea
              id="initial_message"
              {...register('initial_message')}
              placeholder="Tulis keluhan atau informasi awal..."
              rows={4}
              disabled={isSubmitting}
            />
            {errors.initial_message && <p className="text-xs text-critical">{errors.initial_message.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Buat Konsultasi
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
