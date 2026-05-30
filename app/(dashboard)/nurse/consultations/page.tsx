'use client'

import { useAuth } from '@/hooks/useAuth'
import { ConsultationList } from '@/components/consultations/ConsultationList'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'

/**
 * Nurse consultation list page with real-time updates.
 * Shows all consultations assigned to this nurse.
 */
export default function NurseConsultationsPage() {
  const { profile } = useAuth()

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader
        title="Daftar Konsultasi"
        description={`Daftar konsultasi pasien dari puskesmas Anda — ${profile?.full_name ?? 'Perawat'}`}
      />
      <ConsultationList
        cardHref={(id) => `/nurse/consultations/${id}`}
        enableRealtime
      />
    </RoleGuard>
  )
}
