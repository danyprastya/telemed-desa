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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateConsultationInput>({
    resolver: zodResolver(createConsultationSchema),
    defaultValues: {
      vital_sign_id: null,
      initial_message: '',
    },
  })

  const selectedVitalId = watch('vital_sign_id')

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
    fetchVitals()
  }, [patientId])

  const onSubmit = async (data: CreateConsultationInput) => {
    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = {}
      if (data.vital_sign_id) body.vital_sign_id = data.vital_sign_id
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
            <Label htmlFor="vital_sign_id">Data Tanda Vital Terkait (opsional)</Label>
            <Select
              value={selectedVitalId ?? ''}
              onValueChange={(val) => setValue('vital_sign_id', val || null)}
              disabled={isSubmitting || loadingVitals}
            >
              <SelectTrigger id="vital_sign_id">
                <SelectValue placeholder={loadingVitals ? 'Memuat data...' : 'Pilih data tanda vital'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak ada</SelectItem>
                {vitals.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {new Date(v.recorded_at).toLocaleDateString('id-ID')} — Suhu: {v.temperature}°C, SpO₂: {v.spo2}%
                    {v.is_flagged ? ' ⚠️' : ''}
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
