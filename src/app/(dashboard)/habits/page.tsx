'use client'

import { useHabits } from '@/hooks/use-habits'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HabitForm } from '@/components/forms/habit-form'
import { HabitCard } from '@/components/dashboard/habit-card'
import { Plus, Loader2 } from 'lucide-react'

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
  } = useHabits()

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
        <HabitForm onSubmit={createHabit} />
      </div>

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
      )}
    </div>
  )
}
