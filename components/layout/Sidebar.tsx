'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  Building2,
  Hospital,
  FileText,
  Stethoscope,
  UserRound,
  Activity,
  MessageSquare,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

/** Navigation items for each role */
const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Pengguna', href: '/admin/users', icon: Users },
    { label: 'Puskesmas', href: '/admin/puskesmas', icon: Building2 },
    { label: 'Rumah Sakit', href: '/admin/hospitals', icon: Hospital },
    { label: 'API Docs', href: '/admin/api-docs', icon: FileText },
  ],
  nurse: [
    { label: 'Dashboard', href: '/nurse', icon: LayoutDashboard },
    { label: 'Pasien', href: '/nurse/patients', icon: UserRound },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
    { label: 'Konsultasi', href: '/doctor/consultations', icon: MessageSquare },
  ],
}

/**
 * Desktop sidebar with role-based navigation items.
 * Fixed at 240px width on desktop, hidden on mobile.
 */
export function Sidebar() {
  const { profile } = useAuth()
  const pathname = usePathname()

  const role = profile?.role ?? 'nurse'
  const items = NAV_ITEMS[role] ?? []

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-sidebar-bg border-r border-border-green">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-green">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-text-primary leading-tight">TeleMed</h1>
          <p className="text-xs text-text-secondary leading-tight">Desa</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== `/${role}` && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-primary-text'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : '')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-border-green">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary text-sm font-semibold">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {profile?.full_name ?? 'Loading...'}
            </p>
            <p className="text-xs text-text-secondary capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
