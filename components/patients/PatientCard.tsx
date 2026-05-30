'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGender, calculateAge } from '@/lib/utils/format.utils'
import type { Patient } from '@/types/app.types'
import Link from 'next/link'

interface PatientCardProps {
  patient: Patient
  href?: string
}

/**
 * Displays a patient summary card with name, NIK, medical record number, gender, and age.
 * Used in patient lists. Clicking navigates to the patient detail page.
 * @param patient - The patient record to display.
 * @param href - Optional link override. Defaults to /nurse/patients/[id].
 */
export function PatientCard({ patient, href }: PatientCardProps) {
  const link = href ?? `/nurse/patients/${patient.id}`

  return (
    <Link href={link}>
      <Card className="border-border-green hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary truncate">{patient.full_name}</h3>
              <p className="text-xs text-text-secondary truncate mt-1">
                RM: {patient.medical_record_no} &middot; {formatGender(patient.gender)}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 border-border-green text-text-secondary">
              {formatGender(patient.gender)}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-2">
            {calculateAge(patient.date_of_birth)} tahun &middot; {patient.puskesmas?.name ?? ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
