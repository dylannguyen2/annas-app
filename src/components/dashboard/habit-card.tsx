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
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: habit.color + '20', color: habit.color }}
          >
            {habit.icon}
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
                className="font-medium bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
              />
            ) : (
              <h3 onClick={isReadOnly ? undefined : handleNameClick} className={cn("font-medium", !isReadOnly && "cursor-text")}>{habit.name}</h3>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-1 text-sm text-orange-500">
                <Flame className="h-3 w-3" />
                <span>{streak} day streak</span>
              </div>
            )}
          </div>
        </div>
        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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

      <div className="grid grid-cols-7 gap-1">
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
                'flex flex-col items-center py-2 rounded-lg transition-all',
                isTodayDate && 'ring-2 ring-primary ring-offset-1',
                isComplete
                  ? 'bg-primary/20'
                  : !isDisabled && 'hover:bg-accent',
                isFuture && 'opacity-40 cursor-not-allowed'
              )}
            >
              <span className="text-xs text-muted-foreground">{getDayName(date)}</span>
              <span className={cn(
                'text-sm font-medium',
                isTodayDate && 'text-primary'
              )}>
                {getDayNumber(date)}
              </span>
              <div
                className={cn(
                  'w-6 h-6 mt-1 rounded-full flex items-center justify-center transition-all',
                  isComplete
                    ? 'text-white'
                    : 'bg-secondary'
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
