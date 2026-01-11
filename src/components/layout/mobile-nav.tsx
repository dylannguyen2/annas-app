'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useShareView, isPageAllowed } from '@/lib/share-view/context'
import {
  LayoutDashboard,
  CheckSquare,
  Smile,
  Droplet,
  Lightbulb,
  Settings,
  Menu,
  X,
  Dumbbell,
  Heart,
  Calendar,
  UtensilsCrossed,
  BookOpen,
  ListTodo,
  Clapperboard,
  Wallet,
  ShoppingCart,
} from 'lucide-react'

const mainNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Habits', href: '/habits', icon: CheckSquare },
  { name: 'Mood', href: '/mood', icon: Smile },
  { name: 'Health', href: '/health', icon: Heart },
]

const moreNavItems = [
  { name: 'Tasks', href: '/todos', icon: ListTodo },
  { name: 'Meals', href: '/meals', icon: UtensilsCrossed },
  { name: 'Grocery', href: '/grocery', icon: ShoppingCart },
  { name: 'Budget', href: '/budget', icon: Wallet },
  { name: 'Books', href: '/books', icon: BookOpen },
  { name: 'Media', href: '/media', icon: Clapperboard },
  { name: 'Workouts', href: '/workouts', icon: Dumbbell },
  { name: 'Cycle', href: '/cycle', icon: Droplet },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'History', href: '/history', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { isShareView, allowedPages } = useShareView()

  const filterByShareView = (items: typeof mainNavItems) => {
    if (!isShareView) return items
    return items.filter(item => {
      if (item.href === '/settings') return false
      return isPageAllowed(allowedPages, item.href)
    })
  }

  const mainNav = filterByShareView(mainNavItems)
  const moreNav = filterByShareView(moreNavItems)

  const isMoreActive = moreNav.some(item => pathname === item.href)

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setMenuOpen(false)
      setIsAnimating(false)
    }, 200)
  }

  const handleOpen = () => {
    setMenuOpen(true)
  }

  const showMenu = menuOpen || isAnimating

  return (
    <>
      <div 
        className={cn(
          "md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200",
          menuOpen && !isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div
          className={cn(
            "bg-card border-t border-border/50 transition-all duration-300 ease-out",
            showMenu ? "rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)]" : ""
          )}
        >
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              menuOpen && !isAnimating ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between mb-3 px-4">
                <span className="font-semibold text-lg">More</span>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-full hover:bg-secondary active:scale-95 transition-transform"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />
              
              <div className="grid grid-cols-5 pb-3">
                {moreNav.map((item, index) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleClose}
                      className={cn(
                        'flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95 mx-1',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'text-muted-foreground hover:bg-secondary active:bg-secondary/80'
                      )}
                      style={{
                        transitionDelay: menuOpen && !isAnimating ? `${index * 30}ms` : '0ms',
                        transform: menuOpen && !isAnimating ? 'translateY(0)' : 'translateY(10px)',
                        opacity: menuOpen && !isAnimating ? 1 : 0,
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-[11px] mt-1.5 font-medium text-center">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-around items-center h-16 bg-card">
            {mainNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => menuOpen && handleClose()}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                  <span className={cn("text-xs mt-1 transition-all", isActive && "font-medium")}>{item.name}</span>
                </Link>
              )
            })}
            <button
              onClick={() => menuOpen ? handleClose() : handleOpen()}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95',
                isMoreActive || menuOpen
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                "transition-transform duration-200",
                menuOpen ? "rotate-90" : "rotate-0"
              )}>
                <Menu className="h-5 w-5" />
              </div>
              <span className={cn("text-xs mt-1 transition-all", (isMoreActive || menuOpen) && "font-medium")}>More</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
