'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Stethoscope, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginFormValues = z.infer<typeof loginSchema>

/**
 * Login form with email and password fields.
 * Uses React Hook Form + Zod for validation.
 * Authenticates via Supabase Auth, then redirects based on role.
 */
export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email atau password salah.')
        } else {
          setError(signInError.message)
        }
        return
      }

      // Fetch profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Gagal mendapatkan informasi pengguna.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setError('Profil pengguna tidak ditemukan.')
        return
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()
        setError('Akun Anda telah dinonaktifkan. Hubungi administrator.')
        return
      }

      toast.success('Berhasil masuk!')
      router.push(`/${profile.role}`)
      router.refresh()
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border-green">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-4">
          <Stethoscope className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold text-text-primary">TeleMed Desa</CardTitle>
        <CardDescription className="text-text-secondary">
          Sistem Telemedicine Puskesmas Terpencil
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@puskesmas.go.id"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-critical">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-critical">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-muted">
          Hubungi administrator untuk mendapatkan akun.
        </p>
      </CardContent>
    </Card>
  )
}
