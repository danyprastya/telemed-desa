'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { StatsCard } from '@/components/admin/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Clock, UserCheck, Users } from 'lucide-react'

interface DoctorStats {
  open_consultations: number
  in_progress_consultations: number
  closed_today: number
  total_patients: number
}

/**
 * Doctor dashboard showing consultation queue statistics.
 * Fetches stats from the system-wide admin stats endpoint
 * and displays consultation-specific metrics.
 */
export default function DoctorDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DoctorStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const result = await res.json()
        if (result.error) {
          setError(result.error)
        } else {
          setStats({
            open_consultations: result.data.open_consultations ?? 0,
            in_progress_consultations: result.data.in_progress_consultations ?? 0,
            closed_today: result.data.closed_consultations_today ?? 0,
            total_patients: result.data.total_patients ?? 0,
          })
        }
      } catch {
        setError('Gagal memuat statistik')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) return <RoleGuard allowedRoles={['doctor']}><LoadingSpinner /></RoleGuard>
  if (error) return (
    <RoleGuard allowedRoles={['doctor']}>
      <PageHeader title="Dashboard Dokter" description={`Selamat datang, ${profile?.full_name ?? 'Dokter'}`} />
      <div className="text-center py-12">
        <p className="text-critical mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Coba lagi</Button>
      </div>
    </RoleGuard>
  )

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <PageHeader
        title="Dashboard Dokter"
        description={`Selamat datang, ${profile?.full_name ?? 'Dokter'}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Stethoscope}
          title="Konsultasi Menunggu"
          value={stats?.open_consultations ?? 0}
          colorClass="bg-info-light text-info"
        />
        <StatsCard
          icon={Clock}
          title="Sedang Berlangsung"
          value={stats?.in_progress_consultations ?? 0}
          colorClass="bg-warning-light text-warning"
        />
        <StatsCard
          icon={UserCheck}
          title="Selesai Hari Ini"
          value={stats?.closed_today ?? 0}
          colorClass="bg-success-light text-success"
        />
        <StatsCard
          icon={Users}
          title="Total Pasien"
          value={stats?.total_patients ?? 0}
          colorClass="bg-primary-light text-primary"
        />
      </div>

      <Card className="mt-6 border-border-green">
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.href = '/doctor/consultations'}>
            <Stethoscope className="mr-2 h-4 w-4" /> Lihat Konsultasi
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/doctor/consultations?status=open'}>
            <Clock className="mr-2 h-4 w-4" /> Konsultasi Menunggu
          </Button>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
