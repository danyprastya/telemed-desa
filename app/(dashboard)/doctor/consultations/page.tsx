'use client'

import { useAuth } from '@/hooks/useAuth'
import { ConsultationList } from '@/components/consultations/ConsultationList'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'

/**
 * Doctor consultation list page with real-time updates.
 * Shows all consultations with status filter.
 * Uses Supabase Realtime for live consultation queue updates.
 */
export default function DoctorConsultationsPage() {
  const { profile } = useAuth()

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <PageHeader
        title="Daftar Konsultasi"
        description={`Daftar konsultasi dari seluruh puskesmas — ${profile?.full_name ?? 'Dokter'}`}
      />
      <ConsultationList
        cardHref={(id) => `/doctor/consultations/${id}`}
        enableRealtime
      />
    </RoleGuard>
  )
}
