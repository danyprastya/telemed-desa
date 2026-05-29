'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, MessageSquare, Plus, AlertTriangle } from 'lucide-react'
import { formatDate, formatGender, calculateAge } from '@/lib/utils/format.utils'
import { toast } from 'sonner'
import type { Patient, VitalSign, Consultation } from '@/types/app.types'

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, vRes, cRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch(`/api/patients/${id}/vitals?limit=20`),
          fetch(`/api/consultations?page=1&limit=10`),
        ])
        const pD = await pRes.json()
        const vD = await vRes.json()
        const cD = await cRes.json()
        if (pD.data) setPatient(pD.data)
        if (vD.data?.items) setVitals(vD.data.items)
        if (cD.data?.items) setConsultations(cD.data.items.filter((c: Consultation) => c.patient_id === id))
      } catch { toast.error('Gagal mengambil data') }
      finally { setLoading(false) }
    }
    fetchData()
  }, [id])

  const handleCreateConsultation = async () => {
    try {
      const res = await fetch(`/api/patients/${id}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vital_sign_id: vitals[0]?.id ?? null }),
      })
      const result = await res.json()
      if (result.error) toast.error(result.error)
      else { toast.success('Konsultasi berhasil dibuat'); router.refresh() }
    } catch { toast.error('Gagal') }
  }

  if (loading) return <RoleGuard allowedRoles={['nurse']}><LoadingSpinner /></RoleGuard>
  if (!patient) return <RoleGuard allowedRoles={['nurse']}><div className="text-center py-8 text-text-secondary">Pasien tidak ditemukan</div></RoleGuard>
  const lv = patient.latest_vital || vitals[0]

  return (
    <RoleGuard allowedRoles={['nurse']}>
      <PageHeader title={patient.full_name} description={`NIK: ${patient.nik} • RM: ${patient.medical_record_no}`} />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="vitals">Tanda Vital</TabsTrigger>
          <TabsTrigger value="consultations">Konsultasi</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border-green">
              <CardHeader><CardTitle className="text-lg">Data Pasien</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-text-secondary">Jenis Kelamin</span><span>{formatGender(patient.gender)}</span>
                  <span className="text-text-secondary">Tanggal Lahir</span><span>{formatDate(patient.date_of_birth)}</span>
                  <span className="text-text-secondary">Usia</span><span>{calculateAge(patient.date_of_birth)} tahun</span>
                  <span className="text-text-secondary">Alamat</span><span>{patient.address}</span>
                </div>
              </CardContent>
            </Card>
            {lv && (
              <Card className={`border-border-green ${lv.is_flagged ? 'border-critical/50' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Tanda Vital Terakhir</CardTitle>
                  {lv.is_flagged && <Badge className="bg-critical-light text-critical"><AlertTriangle className="mr-1 h-3 w-3" /> Ditandai</Badge>}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-surface"><span className="text-text-secondary block text-xs">Suhu</span><span className="font-semibold">{lv.temperature}°C</span></div>
                    <div className="p-3 rounded-lg bg-surface"><span className="text-text-secondary block text-xs">Denyut Nadi</span><span className="font-semibold">{lv.heart_rate} bpm</span></div>
                    <div className="p-3 rounded-lg bg-surface"><span className="text-text-secondary block text-xs">SpO2</span><span className="font-semibold">{lv.spo2}%</span></div>
                    {lv.systolic_bp && <div className="p-3 rounded-lg bg-surface"><span className="text-text-secondary block text-xs">TD</span><span className="font-semibold">{lv.systolic_bp}/{lv.diastolic_bp}</span></div>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => router.push(`/nurse/patients/${id}/vitals/new`)}><Activity className="mr-2 h-4 w-4" /> Input Tanda Vital</Button>
            <Button variant="outline" onClick={handleCreateConsultation}><MessageSquare className="mr-2 h-4 w-4" /> Buat Konsultasi</Button>
          </div>
        </TabsContent>
        <TabsContent value="vitals">
          <Card className="border-border-green">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Riwayat Tanda Vital</CardTitle>
              <Button size="sm" onClick={() => router.push(`/nurse/patients/${id}/vitals/new`)}><Plus className="mr-1 h-4 w-4" /> Tambah</Button>
            </CardHeader>
            <CardContent>
              {vitals.length === 0 ? <p className="text-sm text-text-muted text-center py-4">Belum ada data</p> : (
                <div className="space-y-3">{vitals.map((v) => (
                  <div key={v.id} className={`p-3 rounded-lg border ${v.is_flagged ? 'border-critical/30 bg-critical-light/30' : 'border-border-green bg-surface'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary">{formatDate(v.recorded_at)}</span>
                      {v.is_flagged && <Badge className="bg-critical-light text-critical text-xs">Ditandai</Badge>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <span>🌡️ {v.temperature}°C</span><span>❤️ {v.heart_rate} bpm</span>
                      <span>🫁 {v.spo2}%</span>{v.systolic_bp && <span>💉 {v.systolic_bp}/{v.diastolic_bp}</span>}
                    </div>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="consultations">
          <Card className="border-border-green">
            <CardHeader><CardTitle className="text-lg">Riwayat Konsultasi</CardTitle></CardHeader>
            <CardContent>
              {consultations.length === 0 ? <p className="text-sm text-text-muted text-center py-4">Belum ada konsultasi</p> : (
                <div className="space-y-3">{consultations.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-border-green bg-surface">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-text-secondary">{formatDate(c.created_at)}</span>
                    </div>
                    {c.closing_notes && <p className="text-xs text-text-muted mt-1">{c.closing_notes}</p>}
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </RoleGuard>
  )
}
