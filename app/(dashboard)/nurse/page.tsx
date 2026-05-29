'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/admin/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserRound, Activity, MessageSquare, AlertTriangle, Plus } from 'lucide-react'

/**
 * Nurse dashboard showing patient summary, flagged vitals, and open consultations.
 */
export default function NurseDashboard() {
  const router = useRouter()
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    flaggedVitals: 0,
    openConsultations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patients count
        const patientsRes = await fetch('/api/patients?limit=1')
        const patientsData = await patientsRes.json()

        // Fetch consultations
        const consultRes = await fetch('/api/consultations?status=open&limit=1')
        const consultData = await consultRes.json()

        setStats({
          totalPatients: patientsData.data?.total ?? 0,
          flaggedVitals: 0, // Will be updated when vitals data is available
          openConsultations: consultData.data?.total ?? 0,
        })
      } catch {
        // Stats will show 0
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader
        title={`Selamat Datang, ${profile?.full_name ?? 'Perawat'}`}
        description="Dashboard perawat — ringkasan pasien dan konsultasi"
      />

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="Total Pasien"
              value={stats.totalPatients}
              icon={UserRound}
              colorClass="bg-primary-light text-primary"
            />
            <StatsCard
              title="Vital Ditandai"
              value={stats.flaggedVitals}
              icon={AlertTriangle}
              colorClass="bg-critical-light text-critical"
            />
            <StatsCard
              title="Konsultasi Terbuka"
              value={stats.openConsultations}
              icon={MessageSquare}
              colorClass="bg-warning-light text-warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border-green">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/nurse/patients/new')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Daftarkan Pasien Baru
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/nurse/patients')}
                >
                  <UserRound className="mr-2 h-4 w-4" /> Lihat Daftar Pasien
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </RoleGuard>
  )
}
