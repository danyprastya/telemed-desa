import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Root metadata for the TeleMed Desa application.
 * Includes PWA manifest link and theme color.
 */
export const viewport: Viewport = {
  themeColor: '#16A34A',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'TeleMed Desa — Sistem Telemedicine Puskesmas',
    template: '%s | TeleMed Desa',
  },
  description: 'Platform telemedicine untuk menghubungkan Puskesmas terpencil dengan dokter di rumah sakit kota. Konsultasi real-time, monitoring tanda vital, dan rujukan digital.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TeleMed Desa',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

/**
 * Root layout wrapping all pages.
 * Provides Geist font, global styles, and toast notifications.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
