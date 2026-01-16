'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, MoreVertical, Pencil, Trash2, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, getWeekDates, getDayName, getDayNumber, isToday, isFutureDate, calculateStreak } from '@/lib/utils/dates'
import { HabitForm } from '@/components/forms/habit-form'
import type { Habit } from '@/types/database'

interface HabitCardProps {
  habit: Habit
  completedDates: string[]
  onToggle: (habitId: string, date: string, completed: boolean) => Promise<void>
  onUpdate: (id: string, data: { name: string; icon: string; color: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isReadOnly?: boolean
}

export function HabitCard({ habit, completedDates, onToggle, onUpdate, onDelete, isReadOnly }: HabitCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(habit.name)
  const weekDates = getWeekDates()
  const today = formatDate(new Date())
  const isCompletedToday = completedDates.includes(today)
  const streak = calculateStreak(completedDates)

  const handleToggle = async (date: string) => {
    const isCompleted = completedDates.includes(date)
    setLoading(date)
    try {
      await onToggle(habit.id, date, !isCompleted)
    } finally {
      setLoading(null)
    }
  }

  const handleNameClick = () => {
    setEditedName(habit.name)
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    const trimmed = editedName.trim()
    if (trimmed && trimmed !== habit.name) {
      onUpdate(habit.id, { name: trimmed, icon: habit.icon, color: habit.color })
    } else {
      setEditedName(habit.name)
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      setEditedName(habit.name)
      setIsEditingName(false)
    }
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-xl blur-md opacity-40"
              style={{ backgroundColor: habit.color }}
            />
            <div
              className="relative w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm border border-white/10"
              style={{ backgroundColor: habit.color + '20', color: habit.color }}
            >
              {habit.icon}
            </div>
          </div>
          <div>
            {isEditingName && !isReadOnly ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                autoFocus
                className="font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 w-full text-foreground"
              />
            ) : (
              <h3 onClick={isReadOnly ? undefined : handleNameClick} className={cn("font-semibold text-foreground", !isReadOnly && "cursor-text hover:text-primary transition-colors")}>{habit.name}</h3>
            )}
            {streak > 0 && (
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full mt-1">
                <Flame className="h-3.5 w-3.5" />
                <span>{streak} day streak</span>
              </div>
            )}
          </div>
        </div>
        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer hover:bg-accent/50">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <HabitForm
                habit={habit}
                onSubmit={(data) => onUpdate(habit.id, data)}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(habit.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 p-3 bg-secondary/20 rounded-xl border border-border/30 mt-1">
        {weekDates.map((date) => {
          const isComplete = completedDates.includes(date)
          const isTodayDate = isToday(date)
          const isFuture = isFutureDate(date)
          const isLoading = loading === date
          const isDisabled = isLoading || isReadOnly || isFuture

          return (
            <button
              key={date}
              onClick={isDisabled ? undefined : () => handleToggle(date)}
              disabled={isDisabled}
              className={cn(
                'flex flex-col items-center py-2.5 px-1 rounded-xl transition-all duration-200 cursor-pointer',
                isTodayDate && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                isComplete
                  ? 'bg-primary/15'
                  : !isDisabled && 'hover:bg-accent/50 hover:scale-105',
                isFuture && 'opacity-40 cursor-not-allowed',
                !isFuture && !isReadOnly && 'cursor-pointer'
              )}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{getDayName(date)}</span>
              <span className={cn(
                'text-sm font-semibold mt-0.5',
                isTodayDate ? 'text-primary' : 'text-foreground'
              )}>
                {getDayNumber(date)}
              </span>
              <div
                className={cn(
                  'w-7 h-7 mt-1.5 rounded-full flex items-center justify-center transition-all duration-200',
                  isComplete
                    ? 'text-white shadow-sm'
                    : 'bg-secondary/50 border border-border/50'
                )}
                style={isComplete ? { backgroundColor: habit.color } : {}}
              >
                {isComplete && <Check className="h-4 w-4" />}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
