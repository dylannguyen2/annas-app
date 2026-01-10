'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/database'

interface HabitToggleProps {
  habit: Habit
  isCompleted: boolean
  onToggle: () => Promise<void>
}

export function HabitToggle({ habit, isCompleted, onToggle }: HabitToggleProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onToggle()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg transition-all',
        isCompleted
          ? 'bg-primary/10 hover:bg-primary/20'
          : 'bg-secondary hover:bg-accent'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0',
          isCompleted
            ? 'text-white'
            : 'bg-background border-2 border-muted'
        )}
        style={isCompleted ? { backgroundColor: habit.color } : {}}
      >
        {isCompleted && <Check className="h-5 w-5" />}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">{habit.icon}</span>
        <span className={cn(
          'font-medium truncate',
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {habit.name}
        </span>
      </div>
    </button>
  )
}
