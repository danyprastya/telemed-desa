'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createVitalSignSchema, type CreateVitalSignInput } from '@/lib/validations/vitals.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface VitalSignFormProps {
  patientId: string
  onSuccess?: () => void
}

/**
 * Vital sign recording form component.
 * Uses React Hook Form with Zod validation.
 * Evaluates flag status server-side after submission.
 * @param patientId - The patient to record vitals for.
 * @param onSuccess - Optional callback after successful submission.
 */
export function VitalSignForm({ patientId, onSuccess }: VitalSignFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateVitalSignInput>({
    resolver: zodResolver(createVitalSignSchema),
    defaultValues: {
      temperature: 0,
      heart_rate: 0,
      spo2: 0,
      systolic_bp: undefined,
      diastolic_bp: undefined,
    },
  })

  const onSubmit = async (data: CreateVitalSignInput) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Tanda vital berhasil dicatat')
        if (result.data?.is_flagged) {
          toast.warning('Tanda vital ditandai — memerlukan perhatian lebih lanjut')
        }
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/nurse/patients/${patientId}`)
        }
      }
    } catch {
      toast.error('Gagal mencatat tanda vital')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <Card className="border-border-green">
        <CardHeader>
          <CardTitle className="text-lg">Input Tanda Vital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Suhu Tubuh (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                {...register('temperature', { valueAsNumber: true })}
                placeholder="36.5"
                disabled={isSubmitting}
              />
              {errors.temperature && <p className="text-xs text-critical">{errors.temperature.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="heart_rate">Denyut Nadi (bpm)</Label>
              <Input
                id="heart_rate"
                type="number"
                {...register('heart_rate', { valueAsNumber: true })}
                placeholder="80"
                disabled={isSubmitting}
              />
              {errors.heart_rate && <p className="text-xs text-critical">{errors.heart_rate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="spo2">SpO₂ (%)</Label>
              <Input
                id="spo2"
                type="number"
                {...register('spo2', { valueAsNumber: true })}
                placeholder="98"
                disabled={isSubmitting}
              />
              {errors.spo2 && <p className="text-xs text-critical">{errors.spo2.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="systolic_bp">Tekanan Sistolik (mmHg)</Label>
              <Input
                id="systolic_bp"
                type="number"
                {...register('systolic_bp', { valueAsNumber: true })}
                placeholder="120"
                disabled={isSubmitting}
              />
              {errors.systolic_bp && <p className="text-xs text-critical">{errors.systolic_bp.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic_bp">Tekanan Diastolik (mmHg)</Label>
              <Input
                id="diastolic_bp"
                type="number"
                {...register('diastolic_bp', { valueAsNumber: true })}
                placeholder="80"
                disabled={isSubmitting}
              />
              {errors.diastolic_bp && <p className="text-xs text-critical">{errors.diastolic_bp.message}</p>}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simpan Tanda Vital
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
