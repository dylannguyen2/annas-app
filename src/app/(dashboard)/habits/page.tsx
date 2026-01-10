'use client'

import { useState } from 'react'
import { useHabits } from '@/hooks/use-habits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HabitForm } from '@/components/forms/habit-form'
import { HabitCard } from '@/components/dashboard/habit-card'
import { HabitToggle } from '@/components/dashboard/habit-toggle'
import { Plus, Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { formatDate } from '@/lib/utils/dates'

export default function HabitsPage() {
  const {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    getCompletionDates,
    isCompleted,
  } = useHabits()
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  const selectedDateStr = selectedDate ? formatDate(selectedDate) : null
  const isToday = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : true
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setCalendarOpen(false)
  }
  
  const clearDateSelection = () => {
    setSelectedDate(undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
          <p className="text-muted-foreground">
            Track your daily habits and build streaks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMM d') : 'Log past date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <HabitForm onSubmit={createHabit} />
        </div>
      </div>
      
      {selectedDate && selectedDateStr && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {isToday ? "Today's Habits" : format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearDateSelection}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No habits yet</p>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => {
                  const completed = isCompleted(habit.id, selectedDateStr)
                  return (
                    <HabitToggle
                      key={habit.id}
                      habit={habit}
                      isCompleted={completed}
                      onToggle={() => toggleCompletion(habit.id, selectedDateStr, !completed)}
                    />
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Start building better habits today. Create your first habit to begin tracking!
            </p>
            <HabitForm
              onSubmit={createHabit}
              trigger={
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Habit
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completedDates={getCompletionDates(habit.id)}
                onToggle={toggleCompletion}
                onUpdate={updateHabit}
                onDelete={deleteHabit}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <HabitForm
              onSubmit={createHabit}
              trigger={
                <Button variant="outline" size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Habit
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
