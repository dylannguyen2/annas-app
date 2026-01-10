'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  CheckSquare,
  Smile,
  Heart,
  ListTodo,
  UtensilsCrossed,
  BookOpen,
  Dumbbell,
  Droplet,
  Lightbulb,
  Calendar,
  Settings,
  Plus,
  Search,
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'main'] },
  { name: 'Habits', href: '/habits', icon: CheckSquare, keywords: ['track', 'daily'] },
  { name: 'Mood', href: '/mood', icon: Smile, keywords: ['feelings', 'emotion', 'journal'] },
  { name: 'Health', href: '/health', icon: Heart, keywords: ['garmin', 'steps', 'sleep'] },
  { name: 'Tasks', href: '/todos', icon: ListTodo, keywords: ['todo', 'eisenhower', 'matrix'] },
  { name: 'Meals', href: '/meals', icon: UtensilsCrossed, keywords: ['food', 'eat', 'nutrition'] },
  { name: 'Books', href: '/books', icon: BookOpen, keywords: ['reading', 'library'] },
  { name: 'Workouts', href: '/workouts', icon: Dumbbell, keywords: ['exercise', 'gym', 'fitness'] },
  { name: 'Cycle', href: '/cycle', icon: Droplet, keywords: ['period', 'menstrual'] },
  { name: 'Insights', href: '/insights', icon: Lightbulb, keywords: ['analytics', 'charts', 'stats'] },
  { name: 'History', href: '/history', icon: Calendar, keywords: ['past', 'log'] },
  { name: 'Settings', href: '/settings', icon: Settings, keywords: ['preferences', 'config', 'account'] },
]

const quickActions = [
  { name: 'Log mood', href: '/mood', icon: Plus, keywords: ['add', 'new'] },
  { name: 'Add workout', href: '/workouts', icon: Plus, keywords: ['add', 'new', 'exercise'] },
  { name: 'Add meal', href: '/meals', icon: Plus, keywords: ['add', 'new', 'food'] },
  { name: 'Add book', href: '/books', icon: Plus, keywords: ['add', 'new', 'reading'] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.name}
              value={`${item.name} ${item.keywords.join(' ')}`}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.name} ${item.keywords.join(' ')}`}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function CommandPaletteTrigger() {
  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border/50 transition-colors cursor-pointer"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">&#8984;</span>K
      </kbd>
    </button>
  )
}
