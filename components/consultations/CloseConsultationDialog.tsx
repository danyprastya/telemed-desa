'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateConsultationSchema, type UpdateConsultationInput } from '@/lib/validations/consultation.schema'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CloseConsultationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  onClosed: () => void
}

/**
 * Confirmation dialog for doctors to close a consultation.
 * Requires closing notes and optionally marks referral as needed.
 * Prevents further messages after closure.
 * @param open - Dialog open state.
 * @param onOpenChange - Dialog open state setter.
 * @param consultationId - The consultation to close.
 * @param onClosed - Callback after successful closure.
 */
export function CloseConsultationDialog({
  open,
  onOpenChange,
  consultationId,
  onClosed,
}: CloseConsultationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UpdateConsultationInput>({
    resolver: zodResolver(updateConsultationSchema),
    defaultValues: {
      closing_notes: '',
      referral_needed: false,
    },
  })

  const referralNeeded = watch('referral_needed')

  const onSubmit = async (data: UpdateConsultationInput) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          status: 'closed',
          closed_at: new Date().toISOString(),
        }),
      })
      const result = await res.json()

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Konsultasi berhasil ditutup')
        onOpenChange(false)
        onClosed()
      }
    } catch {
      toast.error('Gagal menutup konsultasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Tutup Konsultasi</AlertDialogTitle>
          <AlertDialogDescription>
            Tulis catatan penutup. Setelah ditutup, tidak ada pesan baru yang dapat dikirim.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="closing_notes">Catatan Penutup</Label>
            <Textarea
              id="closing_notes"
              {...register('closing_notes')}
              placeholder="Diagnosis, saran, atau tindakan selanjutnya..."
              rows={4}
              disabled={isSubmitting}
            />
            {errors.closing_notes && (
              <p className="text-xs text-critical">{errors.closing_notes.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="referral_needed"
              checked={referralNeeded}
              onCheckedChange={(checked) => setValue('referral_needed', checked === true)}
              disabled={isSubmitting}
            />
            <Label htmlFor="referral_needed" className="cursor-pointer text-sm">
              Pasien memerlukan rujukan ke rumah sakit
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSubmitting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={isSubmitting}
              className="bg-critical hover:bg-critical/90"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tutup Konsultasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
