'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pagination } from '@/components/shared/Pagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROLE_LABELS, type Role } from '@/lib/constants/roles'
import { UserX, UserCheck, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/app.types'

interface UserRow extends Profile {
  puskesmas_name?: string
  hospital_name?: string
}

/**
 * Paginated user management table for admin panel.
 * Supports search, role filtering, and activate/deactivate actions.
 */
export function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [targetUser, setTargetUser] = useState<UserRow | null>(null)
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | null>(null)

  const limit = 10

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const result = await res.json()
      if (result.error) {
        setError(result.error)
      } else {
        setUsers(result.data?.items ?? [])
        setTotal(result.data?.total ?? 0)
        setTotalPages(result.data?.totalPages ?? 1)
      }
    } catch {
      setError('Gagal mengambil data pengguna')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleToggleActive = async () => {
    if (!targetUser || !confirmAction) return
    const isDeactivating = confirmAction === 'deactivate'

    try {
      const method = isDeactivating ? 'DELETE' : 'PATCH'
      const body = isDeactivating ? undefined : JSON.stringify({ is_active: true })
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      const result = await res.json()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isDeactivating ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan kembali')
        fetchUsers()
      }
    } catch {
      toast.error('Gagal memperbarui status pengguna')
    } finally {
      setTargetUser(null)
      setConfirmAction(null)
    }
  }

  const getInstitutionName = (user: UserRow): string => {
    if (user.puskesmas_name) return user.puskesmas_name
    if (user.hospital_name) return user.hospital_name
    return '-'
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-critical mb-4">{error}</p>
        <Button variant="outline" onClick={fetchUsers}>Coba lagi</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama..."
            className="pl-9"
          />
        </div>
        <p className="text-sm text-text-muted shrink-0">{total} pengguna</p>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pengguna"
          description={search ? 'Tidak ada pengguna yang cocok.' : 'Buat pengguna baru untuk memulai.'}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border-green overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Institusi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border-green capitalize">
                        {ROLE_LABELS[user.role as Role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary">{getInstitutionName(user)}</TableCell>
                    <TableCell>
                      <Badge className={user.is_active ? 'bg-success-light text-success' : 'bg-critical-light text-critical'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setTargetUser(user); setConfirmAction('deactivate') }}
                          className="text-critical hover:text-critical hover:bg-critical-light h-8"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setTargetUser(user); setConfirmAction('reactivate') }}
                          className="text-success hover:text-success hover:bg-success-light h-8"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) { setTargetUser(null); setConfirmAction(null) } }}
        title={confirmAction === 'deactivate' ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
        description={
          confirmAction === 'deactivate'
            ? `Nonaktifkan ${targetUser?.full_name}? Pengguna tidak akan bisa login.`
            : `Aktifkan kembali ${targetUser?.full_name}?`
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Nonaktifkan' : 'Aktifkan'}
        destructive={confirmAction === 'deactivate'}
        onConfirm={handleToggleActive}
      />
    </div>
  )
}
