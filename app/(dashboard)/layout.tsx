'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'

/**
 * Dashboard layout with sidebar and top navigation.
 * Wraps all authenticated dashboard pages (admin, nurse, doctor).
 * Provides the AuthProvider context for all child components.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col lg:pl-60">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1280px] p-4 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
