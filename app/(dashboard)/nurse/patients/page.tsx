'use client'

import { useRouter } from 'next/navigation'
import { PatientList } from '@/components/patients/PatientList'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { UserPlus } from 'lucide-react'

/**
 * Nurse patient list page. Uses PatientList component for paginated searchable list.
 */
export default function PatientListPage() {
  const router = useRouter()

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader
        title="Daftar Pasien"
        description="Kelola data pasien di puskesmas Anda"
        actionLabel="Daftarkan Pasien"
        actionIcon={UserPlus}
        onAction={() => router.push('/nurse/patients/new')}
      />
      <PatientList />
    </RoleGuard>
  )
}
