'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Search, ChevronRight } from 'lucide-react'
import { formatDate, formatGender, calculateAge } from '@/lib/utils/format.utils'
import type { Patient } from '@/types/app.types'

/**
 * Patient list page for nurses. Paginated with search.
 */
export default function PatientListPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 10

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/patients?${params}`)
      const result = await res.json()
      if (result.data) {
        setPatients(result.data.items)
        setTotal(result.data.total)
      }
    } catch { /* handled by empty state */ }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader
        title="Daftar Pasien"
        description="Kelola data pasien di puskesmas Anda"
        actionLabel="Daftarkan Pasien"
        actionIcon={UserPlus}
        onAction={() => router.push('/nurse/patients/new')}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Cari nama atau NIK..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : patients.length === 0 ? (
        <EmptyState
          title="Belum ada pasien"
          description="Daftarkan pasien pertama untuk memulai"
          actionLabel="Daftarkan Pasien"
          onAction={() => router.push('/nurse/patients/new')}
        />
      ) : (
        <>
          <div className="grid gap-3">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="border-border-green cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => router.push(`/nurse/patients/${patient.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary truncate">{patient.full_name}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {formatGender(patient.gender)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span>NIK: {patient.nik}</span>
                      <span>RM: {patient.medical_record_no}</span>
                      <span>{calculateAge(patient.date_of_birth)} tahun</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-muted shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
        </>
      )}
    </RoleGuard>
  )
}
