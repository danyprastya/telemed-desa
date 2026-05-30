'use client'

import { useAuth } from '@/hooks/useAuth'
import { MobileSidebar } from './MobileSidebar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

/**
 * Top navigation bar with mobile menu toggle, notification bell, and user menu.
 * Displayed above the main content area on all dashboard pages.
 */
export function TopNav() {
  const { profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-card border-b border-border-green">
      {/* Left: Mobile menu + breadcrumb area */}
      <div className="flex items-center gap-3">
        <MobileSidebar />
      </div>

      {/* Right: Notifications + User menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary text-sm font-semibold">
              {profile?.full_name?.charAt(0) ?? '?'}
            </div>
            <span className="sr-only">Menu pengguna</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{profile?.full_name ?? 'User'}</span>
                <span className="text-xs text-text-secondary capitalize">{profile?.role}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-critical cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
