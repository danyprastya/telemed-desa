'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { Puskesmas } from '@/types/app.types'

/**
 * Puskesmas management page. Admin only.
 */
export default function PuskesmasPage() {
  const [items, setItems] = useState<Puskesmas[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/puskesmas')
    const result = await res.json()
    if (result.data) setItems(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/puskesmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location }),
      })
      const result = await res.json()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Puskesmas berhasil ditambahkan')
        setName('')
        setLocation('')
        setDialogOpen(false)
        fetchData()
      }
    } catch {
      toast.error('Gagal menambahkan puskesmas')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader title="Manajemen Puskesmas" description="Kelola data Puskesmas terpencil" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button className="mb-4" />}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Puskesmas
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Puskesmas Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nama Puskesmas</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Puskesmas Desa Sejahtera" />
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kec. Merdeka, Kab. Nusa" />
            </div>
            <Button onClick={handleCreate} disabled={submitting || !name || !location} className="w-full">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Belum ada puskesmas" description="Tambahkan puskesmas pertama" />
      ) : (
        <div className="rounded-xl border border-border-green overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-text-secondary">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.location}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </RoleGuard>
  )
}
