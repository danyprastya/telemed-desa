'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConsultationForm } from '@/components/consultations/ConsultationForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin } from 'lucide-react'
import { formatDate, formatGender, calculateAge } from '@/lib/utils/format.utils'
import type { Patient } from '@/types/app.types'

/**
 * Nurse page to create a new consultation for a patient.
 * On success, redirects back to the patient detail page.
 */
export default function NewConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`/api/patients/${id}`)
        const result = await res.json()
        if (result.data) setPatient(result.data)
      } finally {
        setLoading(false)
      }
    }
    fetchPatient()
  }, [id])

  if (loading) return <RoleGuard allowedRoles={['nurse']}><LoadingSpinner /></RoleGuard>

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          className="pl-0 text-text-secondary hover:bg-transparent hover:text-text-primary" 
          onClick={() => router.push(`/nurse/patients/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Detail Pasien
        </Button>
      </div>
      <PageHeader title="Buat Konsultasi Baru" description="Konsultasikan pasien dengan dokter di rumah sakit" />
      
      {patient && (
        <Card className="border-border-green mb-6 max-w-2xl">
          <CardHeader><CardTitle className="text-lg">Data Pasien</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-text-secondary">Nama</span><span className="font-medium">{patient.full_name}</span>
              <span className="text-text-secondary">No. RM</span><span>{patient.medical_record_no}</span>
              <span className="text-text-secondary">Jenis Kelamin</span><span>{formatGender(patient.gender)}</span>
              <span className="text-text-secondary">Tanggal Lahir</span><span>{formatDate(patient.date_of_birth)}</span>
              <span className="text-text-secondary">Usia</span><span>{calculateAge(patient.date_of_birth)} tahun</span>
            </div>
            <div className="flex items-start gap-2 text-sm pt-2 border-t border-border-green">
              <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
              <span className="text-text-secondary">{patient.address}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <ConsultationForm patientId={id} />
    </RoleGuard>
  )
}
