'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/layout-client'
import {
  LayoutDashboard,
  CheckSquare,
  Smile,
  Heart,
  Lightbulb,
  Calendar,
  Settings,
  Dumbbell,
  Droplet,
  Sparkles,
  Flower2,
  Menu,
  UtensilsCrossed,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Habits', href: '/habits', icon: CheckSquare },
  { name: 'Mood', href: '/mood', icon: Smile },
  { name: 'Meals', href: '/meals', icon: UtensilsCrossed },
  { name: 'Workouts', href: '/workouts', icon: Dumbbell },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Cycle', href: '/cycle', icon: Droplet },
  { name: 'Health', href: '/health', icon: Heart },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'History', href: '/history', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <aside 
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}
    >
      <div className="flex flex-col flex-grow pt-8 bg-card/50 backdrop-blur-xl border-r border-border/50 overflow-y-auto overflow-x-hidden">
        <div className="px-4">
          <div className={cn(
            "flex items-center flex-shrink-0 transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "gap-3 px-2"
          )}>
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <img src="/anna.jpeg" alt="Anna's World" className="w-9 h-9 rounded-full" width={36} height={36} />
            </div>
            <h1 className={cn(
              "text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap transition-all duration-300 origin-left",
              isCollapsed ? "opacity-0 w-0 scale-0" : "opacity-100 w-auto scale-100"
            )}>
              Anna's World
            </h1>
          </div>
        </div>

        <div className="mt-10 flex-grow flex flex-col px-4">
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center py-3 text-sm font-medium rounded-2xl transition-all duration-200 ease-spring',
                    isCollapsed ? "justify-center px-2" : "px-4",
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 transition-transform duration-300',
                      !isCollapsed && "mr-3",
                      isActive ? 'text-primary-foreground animate-bounce-subtle' : 'text-muted-foreground group-hover:text-accent-foreground group-hover:rotate-12'
                    )}
                  />
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                  )}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 mt-auto">
           <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full mb-4 hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all duration-300",
              isCollapsed ? "h-10 px-0" : "h-9 justify-start px-2"
            )}
          >
            <Menu className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Menu</span>}
          </Button>

          <div className={cn(
            "bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-4 border border-primary/10 transition-all duration-500",
            isCollapsed ? "opacity-0 h-0 p-0 overflow-hidden border-0" : "opacity-100 h-auto"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Flower2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary whitespace-nowrap">Daily Vibe</span>
            </div>
            <p className="text-xs text-muted-foreground italic whitespace-nowrap overflow-hidden text-ellipsis">
              &quot;You&apos;re doing great today!&quot;
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
