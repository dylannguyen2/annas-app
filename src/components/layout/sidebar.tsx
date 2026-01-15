'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/layout-client'
import { useFeatureVisibility } from '@/hooks/use-feature-visibility'
import { useShareView, isPageAllowed } from '@/lib/share-view/context'
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
  Wallet,
  Gift,
  ShoppingCart,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Daily Tracking',
    items: [
      { name: 'Habits', href: '/habits', icon: CheckSquare },
      { name: 'Tasks', href: '/todos', icon: ListTodo },
      { name: 'Mood', href: '/mood', icon: Smile },
      { name: 'Meals', href: '/meals', icon: UtensilsCrossed },
      { name: 'Grocery', href: '/grocery', icon: ShoppingCart },
      { name: 'Budget', href: '/budget', icon: Wallet },
    ],
  },
  {
    label: 'Entertainment',
    items: [
      { name: 'Books', href: '/books', icon: BookOpen },
      { name: 'Movies & TV', href: '/media', icon: Clapperboard },
      { name: 'Wishlist', href: '/wishlist', icon: Gift },
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
  const { isFeatureVisible } = useFeatureVisibility()
  const { isShareView, allowedPages } = useShareView()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const isItemVisible = (href: string) => {
    if (!isFeatureVisible(href)) return false
    if (isShareView && !isPageAllowed(allowedPages, href)) return false
    return true
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1)",
        isCollapsed ? "md:w-20" : "md:w-60"
      )}
    >
      <div className={cn(
        "flex flex-col flex-grow pt-8 bg-card/30 dark:bg-card/20 backdrop-blur-2xl border-r border-border/40 overflow-y-auto overflow-x-hidden scrollbar-none",
        "shadow-[1px_0_30px_0_rgba(0,0,0,0.03)]"
      )}>
        <div className="px-5">
          <div className={cn(
            "flex items-center flex-shrink-0 transition-all duration-500",
            isCollapsed ? "justify-center" : "gap-4"
          )}>
            <div className={cn(
              "relative flex-shrink-0 transition-all duration-500",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/40 before:to-accent/40 before:rounded-2xl before:blur-lg before:opacity-50",
              isCollapsed ? "scale-90" : "scale-100"
            )}>
              <div className="relative bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5 p-0.5 rounded-2xl ring-1 ring-white/40 shadow-lg">
                <img src="/anna.png" alt="Anna's World" className="w-10 h-10 rounded-xl object-cover" width={40} height={40} />
              </div>
            </div>
            <div className={cn(
              "flex flex-col overflow-hidden transition-all duration-500",
              isCollapsed ? "opacity-0 w-0 scale-95" : "opacity-100 w-auto scale-100"
            )}>
              <h1 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-accent whitespace-nowrap">
                Anna's World
              </h1>
              <span className="text-[10px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                Personal Space
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex-grow flex flex-col px-4 space-y-8">
          <nav className="flex-1 space-y-8">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(item => isItemVisible(item.href))
              if (visibleItems.length === 0) return null
              
              return (
                <div key={group.label} className="group/section">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center justify-between px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 transition-colors hover:text-primary/60 cursor-pointer"
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        collapsedGroups.has(group.label) && "-rotate-90"
                      )} />
                    </button>
                  )}
                  <div className={cn(
                    "space-y-1.5 overflow-hidden transition-all duration-200",
                    !isCollapsed && collapsedGroups.has(group.label) && "h-0 opacity-0"
                  )}>
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'group relative flex items-center py-3 text-sm font-medium rounded-2xl transition-all duration-300 ease-out',
                            isCollapsed ? "justify-center px-0 w-12 mx-auto" : "px-4 w-full",
                            isActive
                              ? 'text-primary-foreground shadow-lg shadow-primary/25'
                              : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground'
                          )}
                          title={isCollapsed ? item.name : undefined}
                        >
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 rounded-2xl opacity-100 transition-opacity duration-300" />
                          )}
                          
                          <item.icon
                            className={cn(
                              'relative z-10 h-[1.15rem] w-[1.15rem] flex-shrink-0 transition-transform duration-300',
                              !isCollapsed && "mr-3.5",
                              isActive 
                                ? 'text-primary-foreground scale-110' 
                                : 'text-muted-foreground/80 group-hover:text-primary group-hover:scale-110',
                            )}
                          />
                          <span className={cn(
                            "relative z-10 whitespace-nowrap transition-all duration-500",
                            isCollapsed ? "w-0 opacity-0 hidden translate-x-4" : "w-auto opacity-100 block translate-x-0"
                          )}>
                            {item.name}
                          </span>
                          
                          {isActive && !isCollapsed && (
                            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/30 backdrop-blur-sm" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        <div className="p-4 mt-auto space-y-4">
          {!isShareView && (
            <Link
              href="/settings"
              className={cn(
                'group relative flex items-center py-3 text-sm font-medium rounded-2xl transition-all duration-300',
                isCollapsed ? "justify-center px-0 w-12 mx-auto" : "px-4",
                pathname === '/settings'
                  ? 'text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground'
              )}
              title={isCollapsed ? 'Settings' : undefined}
            >
              {pathname === '/settings' && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 rounded-2xl" />
              )}
              <Settings
                className={cn(
                  'relative z-10 h-[1.15rem] w-[1.15rem] flex-shrink-0 transition-transform duration-300',
                  !isCollapsed && "mr-3.5",
                  pathname === '/settings' ? 'text-primary-foreground' : 'text-muted-foreground/80 group-hover:text-primary group-hover:rotate-45'
                )}
              />
              <span className={cn(
                "relative z-10 whitespace-nowrap transition-all duration-500",
                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
              )}>
                Settings
              </span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-300 rounded-2xl",
              isCollapsed ? "h-12 px-0 w-12 mx-auto" : "h-10 justify-start px-4"
            )}
          >
            <Menu className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Collapse</span>}
          </Button>

          <div className={cn(
            "relative overflow-hidden rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]",
            isCollapsed ? "opacity-0 h-0 p-0 border-0" : "opacity-100 h-auto"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/40 to-accent/10 backdrop-blur-md" />
            <div className="absolute inset-0 border border-white/20 dark:border-white/5 rounded-3xl" />
            
            <div className="relative p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-full ring-1 ring-primary/20">
                  <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/20" />
                </div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Daily Vibe</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                "You're doing great today! Keep up the momentum." 🌿
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
