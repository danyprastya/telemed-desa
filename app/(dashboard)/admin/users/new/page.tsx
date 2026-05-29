'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/user.schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import type { Puskesmas, Hospital } from '@/types/app.types'

/**
 * Create new user form page. Admin only.
 */
export default function CreateUserPage() {
  const router = useRouter()
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([])
  const [hospitalsList, setHospitalsList] = useState<Hospital[]>([])
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      role: undefined,
      puskesmas_id: null,
      hospital_id: null,
    },
  })

  const selectedRole = watch('role')

  useEffect(() => {
    const fetchData = async () => {
      const [puskesmasRes, hospitalsRes] = await Promise.all([
        fetch('/api/admin/puskesmas'),
        fetch('/api/admin/hospitals'),
      ])
      const puskesmasData = await puskesmasRes.json()
      const hospitalsData = await hospitalsRes.json()
      if (puskesmasData.data) setPuskesmasList(puskesmasData.data)
      if (hospitalsData.data) setHospitalsList(hospitalsData.data)
    }
    fetchData()
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setValue('password', password)
    setShowPassword(true)
  }

  const onSubmit = async (data: CreateUserInput) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Pengguna berhasil dibuat')
        router.push('/admin/users')
      }
    } catch {
      toast.error('Gagal membuat pengguna')
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader title="Tambah Pengguna Baru" />

      <Card className="max-w-2xl border-border-green">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input id="full_name" {...register('full_name')} placeholder="Dr. Ahmad" />
              {errors.full_name && <p className="text-xs text-critical">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="email@contoh.com" />
              {errors.email && <p className="text-xs text-critical">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                onValueChange={(val) => setValue('role', val as 'admin' | 'doctor' | 'nurse')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nurse">Perawat/Bidan</SelectItem>
                  <SelectItem value="doctor">Dokter</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-critical">{errors.role.message}</p>}
            </div>

            {selectedRole === 'nurse' && (
              <div className="space-y-2">
                <Label>Puskesmas</Label>
                <Select onValueChange={(val) => setValue('puskesmas_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih puskesmas" />
                  </SelectTrigger>
                  <SelectContent>
                    {puskesmasList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.puskesmas_id && <p className="text-xs text-critical">{errors.puskesmas_id.message}</p>}
              </div>
            )}

            {selectedRole === 'doctor' && (
              <div className="space-y-2">
                <Label>Rumah Sakit</Label>
                <Select onValueChange={(val) => setValue('hospital_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rumah sakit" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalsList.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hospital_id && <p className="text-xs text-critical">{errors.hospital_id.message}</p>}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Buat Pengguna
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
