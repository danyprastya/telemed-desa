'use client'

import { use } from 'react'
import { VitalSignForm } from '@/components/vitals/VitalSignForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'

/**
 * Nurse page to record new vital signs for a patient.
 * On success, redirects back to the patient detail page.
 */
export default function NewVitalSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader title="Input Tanda Vital" description="Catat tanda vital terbaru untuk pasien" />
      <VitalSignForm patientId={id} />
    </RoleGuard>
  )
}
