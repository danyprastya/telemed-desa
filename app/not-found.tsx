import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Custom 404 Not Found page.
 * Provides a clean, branded page when users navigate to a non-existent route.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="rounded-full bg-primary-light p-6 mb-6">
        <FileQuestion className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
      <h2 className="text-xl font-semibold text-text-primary mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-text-secondary mb-8 max-w-md">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/login">Kembali ke Beranda</Link>
      </Button>
    </div>
  )
}
