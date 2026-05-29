import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk',
}

/**
 * Auth layout: full-screen centered, no sidebar.
 * Used for the login page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      {children}
    </div>
  )
}
