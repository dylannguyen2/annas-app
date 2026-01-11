'use client'

import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShareView } from '@/lib/share-view/context'
import { cn } from '@/lib/utils'

interface ShareViewBannerProps {
  ownerName: string | null
}

export function ShareViewBanner({ ownerName }: ShareViewBannerProps) {
  const { isShareView, exitShareView } = useShareView()

  if (!isShareView) return null

  return (
    <div className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-sm",
      "bg-primary/5 border-primary/10 text-primary-foreground/90",
      "flex items-center justify-between px-4 py-2 text-sm",
      "transition-all duration-300 ease-in-out"
    )}>
      <div className="flex items-center gap-2 text-primary">
        <Eye className="h-4 w-4" />
        <span className="font-medium">
          Viewing {ownerName || 'shared'}'s account <span className="opacity-70 font-normal">(read-only)</span>
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={exitShareView}
        className="h-auto p-1 pr-2 pl-2 hover:bg-primary/10 text-primary hover:text-primary gap-1.5 rounded-full"
      >
        <span>Exit</span>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
