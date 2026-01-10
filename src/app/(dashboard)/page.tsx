'use client'

import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useWorkouts } from '@/hooks/use-workouts'
import { useHealth } from '@/hooks/use-health'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HabitToggle } from '@/components/dashboard/habit-toggle'
import { HabitForm } from '@/components/forms/habit-form'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Moon, Footprints, Plus, ArrowRight, Dumbbell } from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import Link from 'next/link'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

export default function DashboardPage() {
  const { habits, loading: habitsLoading, createHabit, toggleCompletion, isCompleted } = useHabits()
  const { moods, loading: moodsLoading, saveMood, getTodayMood } = useMoods()
  const { workouts, loading: workoutsLoading } = useWorkouts()
  const { garminStatus, getTodayHealth, formatSleepDuration, loading: healthLoading } = useHealth()

  const today = formatDate(new Date())
  const completedToday = habits.filter(h => isCompleted(h.id, today)).length
  const totalHabits = habits.length
  const todayMood = getTodayMood()
  const todayHealth = getTodayHealth()

  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo
  })

  const handleSaveMood = async (data: { mood: number; energy: number; stress: number; notes?: string }) => {
    await saveMood({ date: today, ...data })
  }

  const loading = habitsLoading || moodsLoading || workoutsLoading || healthLoading

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Good morning!</h2>
        <p className="text-muted-foreground">
          Here&apos;s your daily overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Mood</CardTitle>
            <span className="text-2xl">{todayMood?.mood ? MOOD_EMOJIS[todayMood.mood] : '❓'}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayMood?.mood ? ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][todayMood.mood] : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayMood ? `Energy: ${todayMood.energy}/5` : <Link href="/mood" className="hover:text-primary">Log your mood →</Link>}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/workouts" className="hover:text-primary">this week →</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {garminStatus.connected && todayHealth?.sleep_duration_seconds 
                ? formatSleepDuration(todayHealth.sleep_duration_seconds) 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {garminStatus.connected 
                ? <Link href="/health" className="hover:text-primary">View sleep data →</Link>
                : <Link href="/settings" className="hover:text-primary">Connect Garmin →</Link>
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
            <Footprints className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {garminStatus.connected && todayHealth?.steps 
                ? todayHealth.steps.toLocaleString() 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {garminStatus.connected 
                ? <Link href="/health" className="hover:text-primary">View activity →</Link>
                : <Link href="/settings" className="hover:text-primary">Connect Garmin →</Link>
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Habits</CardTitle>
            {totalHabits > 0 && (
              <span className="text-sm text-muted-foreground">
                {completedToday}/{totalHabits} done
              </span>
            )}
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  No habits yet. Start tracking today!
                </p>
                <HabitForm
                  onSubmit={createHabit}
                  trigger={
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Habit
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 5).map((habit) => (
                  <HabitToggle
                    key={habit.id}
                    habit={habit}
                    isCompleted={isCompleted(habit.id, today)}
                    onToggle={() => toggleCompletion(habit.id, today, !isCompleted(habit.id, today))}
                  />
                ))}
                {habits.length > 5 && (
                  <Link href="/habits">
                    <Button variant="ghost" className="w-full mt-2">
                      View all {habits.length} habits
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Mood Check</CardTitle>
          </CardHeader>
          <CardContent>
            {todayMood?.mood ? (
              <div className="text-center py-4">
                <span className="text-5xl">{MOOD_EMOJIS[todayMood.mood]}</span>
                <p className="mt-2 text-muted-foreground">
                  You&apos;re feeling {['', 'awful', 'bad', 'okay', 'good', 'great'][todayMood.mood]} today
                </p>
                <Link href="/mood">
                  <Button variant="outline" className="mt-4">
                    Update Mood
                  </Button>
                </Link>
              </div>
            ) : (
              <MoodPicker
                onSave={handleSaveMood}
                compact
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
