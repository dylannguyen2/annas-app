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
  Search,
  Wallet,
  Clapperboard,
  Gift,
  ShoppingCart,
  CirclePlus,
  SmilePlus,
  ListPlus,
  CreditCard,
  Camera,
  BookPlus,
  HeartHandshake,
  ShoppingBasket,
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'main', 'overview', 'summary', 'start', 'today', 'welcome'] },
  { name: 'Habits', href: '/habits', icon: CheckSquare, keywords: ['track', 'daily', 'routine', 'streak', 'goals', 'rituals', 'consistency', 'progress'] },
  { name: 'Tasks', href: '/todos', icon: ListTodo, keywords: ['todo', 'eisenhower', 'matrix', 'priorities', 'checklist', 'urgent', 'important', 'projects', 'work'] },
  { name: 'Mood', href: '/mood', icon: Smile, keywords: ['feelings', 'emotion', 'journal', 'mental', 'happy', 'sad', 'energy', 'stress', 'wellbeing', 'diary'] },
  { name: 'Meals', href: '/meals', icon: UtensilsCrossed, keywords: ['food', 'eat', 'nutrition', 'diet', 'breakfast', 'lunch', 'dinner', 'snack', 'photo', 'calories'] },
  { name: 'Grocery', href: '/grocery', icon: ShoppingCart, keywords: ['shopping', 'groceries', 'list', 'buy', 'supermarket', 'ingredients', 'pantry', 'store'] },
  { name: 'Budget', href: '/budget', icon: Wallet, keywords: ['money', 'expenses', 'income', 'finance', 'spending', 'savings', 'transactions', 'cash', 'bills', 'payments'] },
  { name: 'Books', href: '/books', icon: BookOpen, keywords: ['reading', 'library', 'read', 'novel', 'author', 'pages', 'currently', 'finished', 'tbr', 'bookshelf'] },
  { name: 'Movies & TV', href: '/media', icon: Clapperboard, keywords: ['watch', 'shows', 'film', 'series', 'streaming', 'netflix', 'cinema', 'episodes', 'binge', 'rated'] },
  { name: 'Wishlist', href: '/wishlist', icon: Gift, keywords: ['want', 'gifts', 'shopping', 'buy', 'save', 'later', 'birthday', 'christmas', 'presents', 'ideas'] },
  { name: 'Workouts', href: '/workouts', icon: Dumbbell, keywords: ['exercise', 'gym', 'fitness', 'training', 'run', 'lift', 'cardio', 'strength', 'activity', 'sports'] },
  { name: 'Health', href: '/health', icon: Heart, keywords: ['garmin', 'steps', 'sleep', 'wellness', 'heart', 'rate', 'weight', 'body', 'vitals', 'wearable'] },
  { name: 'Cycle', href: '/cycle', icon: Droplet, keywords: ['period', 'menstrual', 'tracking', 'fertility', 'ovulation', 'pms', 'flow', 'symptoms'] },
  { name: 'Insights', href: '/insights', icon: Lightbulb, keywords: ['analytics', 'charts', 'stats', 'reports', 'trends', 'graphs', 'data', 'metrics', 'weekly', 'monthly'] },
  { name: 'History', href: '/history', icon: Calendar, keywords: ['past', 'log', 'timeline', 'previous', 'records', 'archive', 'dates', 'yesterday', 'last'] },
  { name: 'Settings', href: '/settings', icon: Settings, keywords: ['preferences', 'config', 'account', 'profile', 'options', 'customize', 'theme', 'dark', 'light', 'notifications'] },
]

const quickActions = [
  { name: 'Add task', href: '/todos?action=add', icon: ListPlus, keywords: ['new', 'todo', 'create', 'task', 'item', 'reminder', 'action'] },
  { name: 'Log mood', href: '/mood?action=add', icon: SmilePlus, keywords: ['new', 'feeling', 'emotion', 'record', 'how', 'today', 'check'] },
  { name: 'Add habit', href: '/habits?action=add', icon: CirclePlus, keywords: ['new', 'track', 'routine', 'daily', 'goal', 'start'] },
  { name: 'Add workout', href: '/workouts?action=add', icon: Dumbbell, keywords: ['new', 'exercise', 'gym', 'log', 'session', 'training', 'run'] },
  { name: 'Add meal', href: '/meals?action=add', icon: Camera, keywords: ['new', 'food', 'eat', 'photo', 'snap', 'breakfast', 'lunch', 'dinner'] },
  { name: 'Add expense', href: '/budget?action=add', icon: CreditCard, keywords: ['new', 'money', 'spend', 'transaction', 'payment', 'bought', 'cost', 'paid'] },
  { name: 'Add book', href: '/books?action=add', icon: BookPlus, keywords: ['new', 'reading', 'library', 'started', 'novel', 'currently'] },
  { name: 'Add movie or show', href: '/media?action=add', icon: Clapperboard, keywords: ['new', 'watch', 'film', 'series', 'watched', 'rate', 'review'] },
  { name: 'Add to wishlist', href: '/wishlist?action=add', icon: HeartHandshake, keywords: ['new', 'want', 'gift', 'save', 'later', 'idea', 'product'] },
  { name: 'Add grocery item', href: '/grocery?action=add', icon: ShoppingBasket, keywords: ['new', 'shopping', 'buy', 'need', 'ingredient', 'store', 'list'] },
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
