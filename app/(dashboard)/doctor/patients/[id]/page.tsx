'use client'

import { use, useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { VitalSignHistory } from '@/components/vitals/VitalSignHistory'
import { VitalSignMonitor } from '@/components/vitals/VitalSignMonitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatGender, calculateAge } from '@/lib/utils/format.utils'
import { User, Activity, AlertTriangle, MapPin } from 'lucide-react'
import type { Patient, VitalSign, Consultation } from '@/types/app.types'
import { StatusBadge } from '@/components/shared/StatusBadge'

/**
 * Doctor read-only patient detail page.
 * Shows patient data, vital sign history with charts, monitoring panel, and consultation history.
 */
export default function DoctorPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, vRes, cRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch(`/api/patients/${id}/vitals?limit=20`),
          fetch(`/api/consultations?limit=50`),
        ])
        const pD = await pRes.json()
        const vD = await vRes.json()
        const cD = await cRes.json()
        if (pD.data) setPatient(pD.data)
        else { setError('Pasien tidak ditemukan'); return }
        if (vD.data?.items) setVitals(vD.data.items)
        if (cD.data?.items) {
          setConsultations(
            cD.data.items.filter((c: Consultation) => c.patient_id === id)
          )
        }
      } catch {
        setError('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <RoleGuard allowedRoles={['doctor']}><LoadingSpinner /></RoleGuard>

  if (error || !patient) {
    return (
      <RoleGuard allowedRoles={['doctor']}>
        <div className="text-center py-12">
          <p className="text-critical mb-4">{error ?? 'Pasien tidak ditemukan'}</p>
          <Button variant="outline" onClick={() => window.history.back()}>Kembali</Button>
        </div>
      </RoleGuard>
    )
  }

  const lv = patient.latest_vital || vitals[0]

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <PageHeader title={patient.full_name} description={`NIK: ${patient.nik} • RM: ${patient.medical_record_no}`} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview"><User className="mr-1 h-4 w-4" /> Ringkasan</TabsTrigger>
          <TabsTrigger value="vitals"><Activity className="mr-1 h-4 w-4" /> Tanda Vital</TabsTrigger>
          <TabsTrigger value="monitoring"><Activity className="mr-1 h-4 w-4" /> Monitoring</TabsTrigger>
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
                </div>
                <div className="flex items-start gap-2 text-sm pt-2 border-t border-border-green">
                  <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                  <span className="text-text-secondary">{patient.address}</span>
                </div>
                {patient.puskesmas && (
                  <p className="text-xs text-text-muted">Puskesmas: {patient.puskesmas.name} — {patient.puskesmas.location}</p>
                )}
              </CardContent>
            </Card>

            {lv && (
              <Card className={`border-border-green ${lv.is_flagged ? 'border-critical/50' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Tanda Vital Terakhir</CardTitle>
                  {lv.is_flagged && (
                    <Badge className="bg-critical-light text-critical"><AlertTriangle className="mr-1 h-3 w-3" /> Ditandai</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-surface">
                      <span className="text-text-secondary block text-xs">Suhu</span>
                      <span className="font-semibold">{lv.temperature}°C</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface">
                      <span className="text-text-secondary block text-xs">Nadi</span>
                      <span className="font-semibold">{lv.heart_rate} bpm</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface">
                      <span className="text-text-secondary block text-xs">SpO₂</span>
                      <span className="font-semibold">{lv.spo2}%</span>
                    </div>
                    {lv.systolic_bp && (
                      <div className="p-3 rounded-lg bg-surface">
                        <span className="text-text-secondary block text-xs">TD</span>
                        <span className="font-semibold">{lv.systolic_bp}/{lv.diastolic_bp}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Consultation history */}
          {consultations.length > 0 && (
            <Card className="mt-4 border-border-green">
              <CardHeader><CardTitle className="text-lg">Riwayat Konsultasi</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consultations.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-border-green bg-surface">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={c.status} />
                        <span className="text-xs text-text-secondary">{formatDate(c.created_at)}</span>
                      </div>
                      {c.closing_notes && <p className="text-xs text-text-muted mt-1">{c.closing_notes}</p>}
                      {c.referral_needed && <Badge className="mt-1 bg-warning-light text-warning text-xs">Rujukan</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vitals">
          <VitalSignHistory patientId={id} showCharts />
        </TabsContent>

        <TabsContent value="monitoring">
          <VitalSignMonitor patientId={id} initialVitals={vitals} />
        </TabsContent>
      </Tabs>
    </RoleGuard>
  )
}
