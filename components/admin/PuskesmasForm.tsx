'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const institutionSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(200),
  location: z.string().min(2, 'Lokasi minimal 2 karakter').max(500),
})

type InstitutionInput = z.infer<typeof institutionSchema>

interface PuskesmasFormProps {
  onSuccess?: () => void
}

/**
 * Form to create a new Puskesmas.
 * @param onSuccess - Optional callback after creation.
 */
export function PuskesmasForm({ onSuccess }: PuskesmasFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstitutionInput>({
    resolver: zodResolver(institutionSchema),
    defaultValues: { name: '', location: '' },
  })

  const onSubmit = async (data: InstitutionInput) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/puskesmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Puskesmas berhasil dibuat')
        onSuccess?.()
      }
    } catch {
      toast.error('Gagal membuat puskesmas')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
      <Card className="border-border-green">
        <CardHeader>
          <CardTitle className="text-lg">Puskesmas Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Puskesmas</Label>
            <Input id="name" {...register('name')} placeholder="Nama puskesmas" disabled={isSubmitting} />
            {errors.name && <p className="text-xs text-critical">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" {...register('location')} placeholder="Alamat atau lokasi" disabled={isSubmitting} />
            {errors.location && <p className="text-xs text-critical">{errors.location.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simpan
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
