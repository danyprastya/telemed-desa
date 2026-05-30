'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Menu,
  LayoutDashboard,
  Users,
  Building2,
  Hospital,
  FileText,
  Stethoscope,
  UserRound,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

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
 * Mobile sidebar using shadcn Sheet component.
 * Slides in from the left with role-based navigation.
 */
export function MobileSidebar() {
  const { profile } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const role = profile?.role ?? 'nurse'
  const items = NAV_ITEMS[role] ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Buka menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border-green">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-text-primary">TeleMed Desa</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="px-3 py-4 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-border-green">
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
      </SheetContent>
    </Sheet>
  )
}
