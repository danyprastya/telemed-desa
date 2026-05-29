'use client'

import { PatientForm } from '@/components/patients/PatientForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'

/**
 * New patient registration page. Uses the shared PatientForm component.
 */
export default function NewPatientPage() {
  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader title="Daftarkan Pasien Baru" description="Isi data pasien untuk mendaftarkannya ke sistem" />
      <PatientForm />
    </RoleGuard>
  )
}
