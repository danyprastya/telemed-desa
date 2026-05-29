'use client'

import { useRouter } from 'next/navigation'
import { UserTable } from '@/components/admin/UserTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { UserPlus } from 'lucide-react'

/**
 * Admin user management page. Uses UserTable component for paginated searchable table.
 */
export default function AdminUsersPage() {
  const router = useRouter()

  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola semua akun perawat, dokter, dan administrator"
        actionLabel="Tambah Pengguna"
        actionIcon={UserPlus}
        onAction={() => router.push('/admin/users/new')}
      />
      <UserTable />
    </RoleGuard>
  )
}
