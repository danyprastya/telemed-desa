'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/user.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { Puskesmas, Hospital } from '@/types/app.types'

/**
 * Admin form for creating new users (nurses or doctors).
 * Conditionally shows puskesmas or hospital selector based on role.
 * Includes password show/hide toggle and random password generator.
 */
export function UserForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([])
  const [hospitalsList, setHospitalsList] = useState<Hospital[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'nurse',
      puskesmas_id: null,
      hospital_id: null,
    },
  })

  const role = watch('role')

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const [pRes, hRes] = await Promise.all([
          fetch('/api/admin/puskesmas'),
          fetch('/api/admin/hospitals'),
        ])
        const pData = await pRes.json()
        const hData = await hRes.json()
        if (pData.data) setPuskesmasList(pData.data)
        if (hData.data) setHospitalsList(hData.data)
      } catch {
        toast.error('Gagal memuat data institusi')
      }
    }
    fetchInstitutions()
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let pass = ''
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setValue('password', pass)
    setShowPassword(true)
  }

  const onSubmit = async (data: CreateUserInput) => {
    setIsSubmitting(true)
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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <Card className="border-border-green">
        <CardHeader>
          <CardTitle className="text-lg">Data Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input id="full_name" {...register('full_name')} placeholder="Nama lengkap" disabled={isSubmitting} />
              {errors.full_name && <p className="text-xs text-critical">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="email@example.com" disabled={isSubmitting} />
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
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generatePassword}
                  disabled={isSubmitting}
                  title="Generate random password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {errors.password && <p className="text-xs text-critical">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(val) => setValue('role', val as 'nurse' | 'doctor' | 'admin')} disabled={isSubmitting}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nurse">Perawat/Bidan</SelectItem>
                  <SelectItem value="doctor">Dokter</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-critical">{errors.role.message}</p>}
            </div>
            {role === 'nurse' && (
              <div className="space-y-2">
                <Label htmlFor="puskesmas_id">Puskesmas</Label>
                <Select onValueChange={(val) => setValue('puskesmas_id', val as string)} disabled={isSubmitting}>
                  <SelectTrigger id="puskesmas_id">
                    <SelectValue placeholder="Pilih Puskesmas" />
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
            {role === 'doctor' && (
              <div className="space-y-2">
                <Label htmlFor="hospital_id">Rumah Sakit</Label>
                <Select onValueChange={(val) => setValue('hospital_id', val as string)} disabled={isSubmitting}>
                  <SelectTrigger id="hospital_id">
                    <SelectValue placeholder="Pilih Rumah Sakit" />
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
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Buat Pengguna
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
