'use client'

import { use } from 'react'
import { ConsultationForm } from '@/components/consultations/ConsultationForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'

/**
 * Nurse page to create a new consultation for a patient.
 * On success, redirects back to the patient detail page.
 */
export default function NewConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader title="Buat Konsultasi Baru" description="Konsultasikan pasien dengan dokter di rumah sakit" />
      <ConsultationForm patientId={id} />
    </RoleGuard>
  )
}
