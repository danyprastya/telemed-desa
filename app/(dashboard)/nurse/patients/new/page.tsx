'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPatientSchema, type CreatePatientInput } from '@/lib/validations/patient.schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Register new patient form. Nurse only.
 */
export default function NewPatientPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
  })

  const onSubmit = async (data: CreatePatientInput) => {
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
        router.push(`/nurse/patients/${result.data.id}`)
      }
    } catch {
      toast.error('Gagal mendaftarkan pasien')
    }
  }

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader title="Daftarkan Pasien Baru" />
      <Card className="max-w-2xl border-border-green">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input id="full_name" {...register('full_name')} placeholder="Nama lengkap pasien" />
              {errors.full_name && <p className="text-xs text-critical">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nik">NIK (16 digit)</Label>
                <Input id="nik" {...register('nik')} placeholder="3201234567890123" maxLength={16} />
                {errors.nik && <p className="text-xs text-critical">{errors.nik.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_record_no">No. Rekam Medis</Label>
                <Input id="medical_record_no" {...register('medical_record_no')} placeholder="RM-001" />
                {errors.medical_record_no && <p className="text-xs text-critical">{errors.medical_record_no.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                {errors.date_of_birth && <p className="text-xs text-critical">{errors.date_of_birth.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select onValueChange={(val) => setValue('gender', val as 'male' | 'female')}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
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
              <Textarea id="address" {...register('address')} placeholder="Alamat lengkap pasien" rows={3} />
              {errors.address && <p className="text-xs text-critical">{errors.address.message}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Daftarkan Pasien
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
