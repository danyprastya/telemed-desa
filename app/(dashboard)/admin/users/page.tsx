'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserPlus, Search, Ban, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_LABELS } from '@/lib/constants/roles'
import type { UserRole } from '@/types/app.types'

interface UserRow {
  id: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  puskesmas: { name: string } | null
  hospital: { name: string } | null
}

/**
 * Admin user management page with paginated table.
 */
export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; name: string; active: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 10

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params}`)
      const result = await res.json()
      if (result.data) {
        setUsers(result.data.items)
        setTotal(result.data.total)
      }
    } catch {
      toast.error('Gagal mengambil data pengguna')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleToggleActive = async () => {
    if (!confirmDialog) return
    setActionLoading(true)
    try {
      if (confirmDialog.active) {
        // Deactivate
        await fetch(`/api/admin/users/${confirmDialog.id}`, { method: 'DELETE' })
        toast.success('Pengguna berhasil dinonaktifkan')
      } else {
        // Reactivate
        await fetch(`/api/admin/users/${confirmDialog.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true }),
        })
        toast.success('Pengguna berhasil diaktifkan kembali')
      }
      fetchUsers()
    } catch {
      toast.error('Gagal memproses')
    } finally {
      setActionLoading(false)
      setConfirmDialog(null)
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola semua akun perawat, dokter, dan administrator"
        actionLabel="Tambah Pengguna"
        actionIcon={UserPlus}
        onAction={() => router.push('/admin/users/new')}
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Cari nama pengguna..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          title="Belum ada pengguna"
          description="Tambahkan pengguna pertama untuk memulai"
          actionLabel="Tambah Pengguna"
          onAction={() => router.push('/admin/users/new')}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border-green overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Institusi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-text-secondary">
                      {u.puskesmas?.name || u.hospital?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {u.is_active ? (
                        <Badge className="bg-success-light text-success border-success/20" variant="outline">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="bg-critical-light text-critical border-critical/20" variant="outline">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDialog({
                          id: u.id,
                          name: u.full_name,
                          active: u.is_active,
                        })}
                      >
                        {u.is_active ? (
                          <Ban className="h-4 w-4 text-critical" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={!!confirmDialog}
        onOpenChange={() => setConfirmDialog(null)}
        title={confirmDialog?.active ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
        description={`Apakah Anda yakin ingin ${confirmDialog?.active ? 'menonaktifkan' : 'mengaktifkan kembali'} ${confirmDialog?.name}?`}
        confirmLabel={confirmDialog?.active ? 'Nonaktifkan' : 'Aktifkan'}
        destructive={confirmDialog?.active ?? false}
        onConfirm={handleToggleActive}
        loading={actionLoading}
      />
    </RoleGuard>
  )
}
