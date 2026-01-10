'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  Smile,
  Droplet,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Habits', href: '/habits', icon: CheckSquare },
  { name: 'Mood', href: '/mood', icon: Smile },
  { name: 'Cycle', href: '/cycle', icon: Droplet },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
