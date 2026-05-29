'use client'

import { use, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ChatWindow } from '@/components/consultations/ChatWindow'
import { VitalSignMonitor } from '@/components/vitals/VitalSignMonitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatGender, calculateAge } from '@/lib/utils/format.utils'
import { Activity, MessageSquare, User, AlertTriangle, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { Consultation, Message, VitalSign, Patient } from '@/types/app.types'

/**
 * Doctor consultation detail page with chat, patient summary, and live vitals.
 * Auto-claims the consultation when opened if no doctor is assigned.
 */
export default function DoctorConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuth()
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/consultations/${id}`)
        const result = await res.json()
        if (result.error) {
          setError(result.error)
          return
        }
        const con: Consultation = result.data
        setConsultation(con)
        setPatient(con.patient ?? null)
        setMessages(result.data.messages ?? [])

        // Fetch vitals separately for monitoring
        if (con.patient_id) {
          const vRes = await fetch(`/api/patients/${con.patient_id}/vitals?limit=20`)
          const vData = await vRes.json()
          if (vData.data?.items) setVitals(vData.data.items)
        }

        // Auto-claim: if no doctor assigned and consultation is open, claim it
        if (!con.doctor_id && con.status === 'open' && profile?.role === 'doctor') {
          await claimConsultation(con.id)
        }
      } catch {
        setError('Gagal memuat data konsultasi')
      } finally {
        setIsLoading(false)
      }
    }
    if (profile) fetchData()
  }, [id, profile])

  /**
   * Auto-claims an open consultation by assigning the current doctor.
   * Prevents two doctors from claiming the same consultation.
   */
  const claimConsultation = async (consultationId: string) => {
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: profile?.id,
          status: 'in_progress',
        }),
      })
      const result = await res.json()
      if (result.data) {
        setConsultation((prev) => prev ? { ...prev, doctor_id: profile?.id ?? null, status: 'in_progress' } : null)
      }
    } catch {
      toast.error('Gagal mengklaim konsultasi')
    }
  }

  const handleConsultationUpdated = async () => {
    const res = await fetch(`/api/consultations/${id}`)
    const result = await res.json()
    if (result.data) setConsultation(result.data)
  }

  if (isLoading) return <RoleGuard allowedRoles={['doctor']}><LoadingSpinner /></RoleGuard>

  if (error || !consultation) {
    return (
      <RoleGuard allowedRoles={['doctor']}>
        <div className="text-center py-12">
          <p className="text-critical mb-4">{error ?? 'Konsultasi tidak ditemukan'}</p>
          <Button variant="outline" onClick={() => window.location.href = '/doctor/consultations'}>
            Kembali
          </Button>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <PageHeader
        title={patient?.full_name ?? 'Detail Konsultasi'}
        description={`NIK: ${patient?.nik ?? '-'} • Puskesmas: ${patient?.puskesmas?.name ?? '-'} • Status: ${consultation.status}`}
      />

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat"><MessageSquare className="mr-1 h-4 w-4" /> Chat</TabsTrigger>
          <TabsTrigger value="patient"><User className="mr-1 h-4 w-4" /> Data Pasien</TabsTrigger>
          <TabsTrigger value="monitoring"><Activity className="mr-1 h-4 w-4" /> Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <ChatWindow
            consultation={consultation}
            initialMessages={messages}
            onConsultationUpdated={handleConsultationUpdated}
          />
        </TabsContent>

        <TabsContent value="patient">
          {patient ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border-green">
                <CardHeader><CardTitle className="text-lg">Data Pasien</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-text-secondary">Nama</span><span className="font-medium">{patient.full_name}</span>
                    <span className="text-text-secondary">NIK</span><span>{patient.nik}</span>
                    <span className="text-text-secondary">No. RM</span><span>{patient.medical_record_no}</span>
                    <span className="text-text-secondary">Jenis Kelamin</span><span>{formatGender(patient.gender)}</span>
                    <span className="text-text-secondary">Tanggal Lahir</span><span>{formatDate(patient.date_of_birth)}</span>
                    <span className="text-text-secondary">Usia</span><span>{calculateAge(patient.date_of_birth)} tahun</span>
                  </div>
                  <div className="pt-2 border-t border-border-green">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{patient.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border-green">
                <CardHeader><CardTitle className="text-lg">Info Konsultasi</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-text-secondary">Perawat</span><span className="font-medium">{consultation.nurse?.full_name ?? '-'}</span>
                    <span className="text-text-secondary">Dokter</span><span className="font-medium">{consultation.doctor?.full_name ?? 'Belum diklaim'}</span>
                  </div>
                  {consultation.vital_sign && (
                    <div className="pt-2 border-t border-border-green">
                      <p className="text-xs text-text-secondary mb-1">Tanda Vital Terkait</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span>Suhu: {consultation.vital_sign.temperature}°C</span>
                        <span>Nadi: {consultation.vital_sign.heart_rate} bpm</span>
                        <span>SpO₂: {consultation.vital_sign.spo2}%</span>
                        {consultation.vital_sign.systolic_bp && (
                          <span>TD: {consultation.vital_sign.systolic_bp}/{consultation.vital_sign.diastolic_bp}</span>
                        )}
                      </div>
                      {consultation.vital_sign.is_flagged && (
                        <Badge className="mt-1 bg-critical-light text-critical text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Ditandai
                        </Badge>
                      )}
                    </div>
                  )}
                  {consultation.closing_notes && (
                    <div className="pt-2 border-t border-border-green">
                      <p className="text-xs text-text-secondary mb-1">Catatan Penutup</p>
                      <p className="text-sm">{consultation.closing_notes}</p>
                      {consultation.referral_needed && (
                        <Badge className="mt-1 bg-warning-light text-warning text-xs">Rujukan diperlukan</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">Data pasien tidak tersedia</div>
          )}
        </TabsContent>

        <TabsContent value="monitoring">
          <VitalSignMonitor patientId={consultation.patient_id} initialVitals={vitals} />
        </TabsContent>
      </Tabs>
    </RoleGuard>
  )
}
