'use client'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { CommandPaletteTrigger } from '@/components/command-palette'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/60 border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 transition-all duration-300 ease-in-out">
        <div className="md:hidden">
          <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Anna's World <span className="text-foreground filter grayscale-[0.2]">🌏</span>
          </h1>
        </div>
        <div className="hidden md:flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-semibold mb-0.5">
            Today's Overview
          </span>
          <p className="text-sm font-medium text-foreground/90 tracking-tight font-sans">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <CommandPaletteTrigger />
          </div>
          
          <div className="h-4 w-px bg-border/60 hidden sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full hover:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all duration-300 group"
              >
                <Avatar className="h-9 w-9 border border-primary/10 shadow-sm transition-transform group-active:scale-95 group-hover:shadow-md ring-2 ring-transparent group-hover:ring-primary/10">
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary font-medium">
                    A
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 p-1 border-border/50 bg-background/80 backdrop-blur-xl shadow-xl rounded-xl">
              <DropdownMenuItem 
                onClick={() => router.push('/settings')}
                className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer py-2.5 px-3"
              >
                <User className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50 my-1" />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="rounded-lg focus:bg-destructive/10 focus:text-destructive text-destructive/80 cursor-pointer py-2.5 px-3"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
