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
  Flower2,
  Menu,
  UtensilsCrossed,
  BookOpen,
  ListTodo,
  Clapperboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Daily Tracking',
    items: [
      { name: 'Habits', href: '/habits', icon: CheckSquare },
      { name: 'Tasks', href: '/todos', icon: ListTodo },
      { name: 'Mood', href: '/mood', icon: Smile },
      { name: 'Meals', href: '/meals', icon: UtensilsCrossed },
    ],
  },
  {
    label: 'Entertainment',
    items: [
      { name: 'Books', href: '/books', icon: BookOpen },
      { name: 'Movies & TV', href: '/media', icon: Clapperboard },
    ],
  },
  {
    label: 'Health & Fitness',
    items: [
      { name: 'Workouts', href: '/workouts', icon: Dumbbell },
      { name: 'Health', href: '/health', icon: Heart },
      { name: 'Cycle', href: '/cycle', icon: Droplet },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Insights', href: '/insights', icon: Lightbulb },
      { name: 'History', href: '/history', icon: Calendar },
    ],
  },
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
      <div className="flex flex-col flex-grow pt-6 bg-card/50 backdrop-blur-xl border-r border-border/50 overflow-y-auto overflow-x-hidden">
        <div className="px-4">
          <div className={cn(
            "flex items-center flex-shrink-0 transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "gap-3 px-2"
          )}>
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <img src="/anna.png" alt="Anna's World" className="w-9 h-9 rounded-full" width={36} height={36} />
            </div>
            <h1 className={cn(
              "text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap transition-all duration-300 origin-left",
              isCollapsed ? "opacity-0 w-0 scale-0" : "opacity-100 w-auto scale-100"
            )}>
              Anna's World 🌏
            </h1>
          </div>
        </div>

        <div className="mt-6 flex-grow flex flex-col px-3">
          <nav className="flex-1 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'group flex items-center py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                          isCollapsed ? "justify-center px-2" : "px-3",
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200',
                            !isCollapsed && "mr-3",
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
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
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-3 mt-auto space-y-2">
          <Link
            href="/settings"
            className={cn(
              'group flex items-center py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
              isCollapsed ? "justify-center px-2" : "px-3",
              pathname === '/settings'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings
              className={cn(
                'h-[18px] w-[18px] flex-shrink-0',
                !isCollapsed && "mr-3",
                pathname === '/settings' ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
              )}
            />
            <span className={cn(
              "whitespace-nowrap transition-all duration-300",
              isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
            )}>
              Settings
            </span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all duration-300",
              isCollapsed ? "h-10 px-0" : "h-9 justify-start px-3"
            )}
          >
            <Menu className="h-[18px] w-[18px]" />
            {!isCollapsed && <span className="ml-3">Collapse</span>}
          </Button>

          <div className={cn(
            "bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-3 border border-primary/10 transition-all duration-500",
            isCollapsed ? "opacity-0 h-0 p-0 overflow-hidden border-0" : "opacity-100 h-auto"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Flower2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Daily Vibe</span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              You're doing great today!
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
