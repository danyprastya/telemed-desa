'use client'

import { UserForm } from '@/components/admin/UserForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'

/**
 * Admin create user page. Uses the shared UserForm component.
 */
export default function CreateUserPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader title="Tambah Pengguna Baru" description="Buat akun untuk perawat, dokter, atau administrator" />
      <UserForm />
    </RoleGuard>
  )
}
