'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPatientSchema, type CreatePatientInput } from '@/lib/validations/patient.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Shared patient registration form component.
 * Uses React Hook Form with Zod validation.
 * On success, navigates to the new patient's detail page or calls onSuccess.
 * @param onSuccess - Optional callback invoked with the created patient ID.
 */
export function PatientForm({ onSuccess }: { onSuccess?: (patientId: string) => void }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      full_name: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      medical_record_no: '',
    },
  })

  const gender = watch('gender')

  const onSubmit = async (data: CreatePatientInput) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Pasien berhasil didaftarkan')
        if (onSuccess) {
          onSuccess(result.data.id)
        } else {
          router.push(`/nurse/patients/${result.data.id}`)
        }
      }
    } catch {
      toast.error('Gagal mendaftarkan pasien')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <Card className="border-border-green">
        <CardHeader>
          <CardTitle className="text-lg">Data Pasien</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input id="full_name" {...register('full_name')} placeholder="Nama lengkap pasien" disabled={isSubmitting} />
              {errors.full_name && <p className="text-xs text-critical">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_record_no">Nomor Rekam Medis</Label>
              <Input id="medical_record_no" {...register('medical_record_no')} placeholder="Nomor RM" disabled={isSubmitting} />
              {errors.medical_record_no && <p className="text-xs text-critical">{errors.medical_record_no.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
              <Input id="date_of_birth" type="date" {...register('date_of_birth')} disabled={isSubmitting} />
              {errors.date_of_birth && <p className="text-xs text-critical">{errors.date_of_birth.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <Select
                value={gender}
                onValueChange={(val) => setValue('gender', val as 'male' | 'female')}
                disabled={isSubmitting}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-critical">{errors.gender.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" {...register('address')} placeholder="Alamat lengkap pasien" rows={3} disabled={isSubmitting} />
            {errors.address && <p className="text-xs text-critical">{errors.address.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Daftarkan Pasien
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
