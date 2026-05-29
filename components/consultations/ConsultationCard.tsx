'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatConsultationStatus } from '@/lib/utils/format.utils'
import { Stethoscope } from 'lucide-react'
import type { Consultation } from '@/types/app.types'

interface ConsultationCardProps {
  consultation: Consultation
  href?: string
}

/**
 * Consultation summary card showing patient info, status, and timestamps.
 * Used in consultation lists for both nurse and doctor views.
 * @param consultation - The consultation record.
 * @param href - Optional link override.
 */
export function ConsultationCard({ consultation, href }: ConsultationCardProps) {
  const link = href ?? `/doctor/consultations/${consultation.id}`
  const patientName = consultation.patient?.full_name ?? 'Tidak diketahui'
  const nurseName = consultation.nurse?.full_name ?? '-'
  const doctorName = consultation.doctor?.full_name ?? 'Belum diklaim'

  return (
    <Link href={link}>
      <Card className="border-border-green hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="h-4 w-4 text-text-muted shrink-0" />
                <h3 className="font-semibold text-text-primary truncate">{patientName}</h3>
              </div>
              <div className="text-xs text-text-secondary space-y-0.5">
                <p>NIK: {consultation.patient?.nik ?? '-'}</p>
                <p>Perawat: {nurseName}</p>
                <p>Dokter: {doctorName}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <StatusBadge status={consultation.status} />
              <p className="text-xs text-text-muted mt-1">{formatDate(consultation.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
