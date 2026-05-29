'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/admin/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RoleGuard } from '@/components/layout/RoleGuard'
import type { SystemStats } from '@/types/api.types'
import {
  Users,
  UserRound,
  Stethoscope,
  MessageSquare,
  Clock,
  CheckCircle2,
  Building2,
  Hospital,
} from 'lucide-react'

/**
 * Admin dashboard page showing system-wide statistics.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const result = await res.json()
        if (result.error) {
          setError(result.error)
        } else {
          setStats(result.data)
        }
      } catch {
        setError('Gagal mengambil statistik')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader
        title="Dashboard Administrator"
        description="Ringkasan statistik sistem TeleMed Desa"
      />

      {loading && <LoadingSpinner />}
      {error && (
        <div className="text-center text-critical py-8">{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Pasien"
            value={stats.total_patients}
            icon={UserRound}
            colorClass="bg-primary-light text-primary"
          />
          <StatsCard
            title="Perawat Aktif"
            value={stats.total_nurses}
            icon={Users}
            colorClass="bg-info-light text-info"
          />
          <StatsCard
            title="Dokter Aktif"
            value={stats.total_doctors}
            icon={Stethoscope}
            colorClass="bg-success-light text-success"
          />
          <StatsCard
            title="Konsultasi Menunggu"
            value={stats.open_consultations}
            icon={MessageSquare}
            colorClass="bg-warning-light text-warning"
          />
          <StatsCard
            title="Konsultasi Berlangsung"
            value={stats.in_progress_consultations}
            icon={Clock}
            colorClass="bg-info-light text-info"
          />
          <StatsCard
            title="Selesai Hari Ini"
            value={stats.closed_consultations_today}
            icon={CheckCircle2}
            colorClass="bg-success-light text-success"
          />
          <StatsCard
            title="Total Puskesmas"
            value={stats.total_puskesmas}
            icon={Building2}
            colorClass="bg-primary-light text-primary"
          />
          <StatsCard
            title="Total Rumah Sakit"
            value={stats.total_hospitals}
            icon={Hospital}
            colorClass="bg-primary-light text-primary"
          />
        </div>
      )}
    </RoleGuard>
  )
}
