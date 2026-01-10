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
import { Moon, Footprints, Plus, ArrowRight, Dumbbell, Sun, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import Link from 'next/link'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: "Good morning", icon: Sun }
  if (hour < 18) return { text: "Good afternoon", icon: Sun }
  return { text: "Good evening", icon: Moon }
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
  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo
  })

  const handleSaveMood = async (data: { mood: number; energy: number; stress: number; notes?: string; date: Date }) => {
    await saveMood({ date: formatDate(data.date), mood: data.mood, energy: data.energy, stress: data.stress, notes: data.notes })
  }

  const loading = habitsLoading || moodsLoading || workoutsLoading || healthLoading

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8 animate-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            {greeting.text}! <GreetingIcon className="h-8 w-8 text-yellow-500 animate-spin-slow" />
          </h2>
          <p className="text-muted-foreground text-lg mt-2 flex items-center gap-2">
            Ready to have a wonderful day? <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-100 dark:border-pink-900/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300">Today&apos;s Mood</CardTitle>
            <span className="text-2xl filter drop-shadow-md transition-transform hover:scale-110">{todayMood?.mood ? MOOD_EMOJIS[todayMood.mood] : '❓'}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
              {todayMood?.mood ? ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][todayMood.mood] : '--'}
            </div>
            <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
              {todayMood ? `Energy: ${todayMood.energy}/5` : <Link href="/mood" className="hover:underline flex items-center gap-1">Log your mood <ArrowRight className="h-3 w-3" /></Link>}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-900/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Workouts</CardTitle>
            <div className="p-2 bg-white/50 dark:bg-white/10 rounded-full">
              <Dumbbell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              <Link href="/workouts" className="hover:underline flex items-center gap-1">this week <ArrowRight className="h-3 w-3" /></Link>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-100 dark:border-indigo-900/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Sleep</CardTitle>
            <div className="p-2 bg-white/50 dark:bg-white/10 rounded-full">
              <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {garminStatus.connected && todayHealth?.sleep_duration_seconds 
                ? formatSleepDuration(todayHealth.sleep_duration_seconds) 
                : '--'}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              {garminStatus.connected 
                ? <Link href="/health" className="hover:underline flex items-center gap-1">View sleep data <ArrowRight className="h-3 w-3" /></Link>
                : <Link href="/settings" className="hover:underline flex items-center gap-1">Connect Garmin <ArrowRight className="h-3 w-3" /></Link>
              }
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-100 dark:border-emerald-900/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Steps</CardTitle>
            <div className="p-2 bg-white/50 dark:bg-white/10 rounded-full">
              <Footprints className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {garminStatus.connected && todayHealth?.steps 
                ? todayHealth.steps.toLocaleString() 
                : '--'}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {garminStatus.connected 
                ? <Link href="/health" className="hover:underline flex items-center gap-1">View activity <ArrowRight className="h-3 w-3" /></Link>
                : <Link href="/settings" className="hover:underline flex items-center gap-1">Connect Garmin <ArrowRight className="h-3 w-3" /></Link>
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden border-2 border-primary/5 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CardTitle>Today&apos;s Habits</CardTitle>
              {totalHabits > 0 && (
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {completedToday}/{totalHabits} done
                </span>
              )}
            </div>
            {totalHabits > 0 && (
              <HabitForm
                onSubmit={createHabit}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent className="">
            {habits.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4 animate-bounce">🌱</div>
                <p className="text-muted-foreground mb-6 text-lg">
                  Plant your first habit seed today!
                </p>
                <HabitForm
                  onSubmit={createHabit}
                  trigger={
                    <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all">
                      <Plus className="mr-2 h-5 w-5" />
                      Add First Habit
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {habits.slice(0, 5).map((habit) => (
                  <div key={habit.id} className="transform transition-all duration-200 hover:scale-[1.01]">
                    <HabitToggle
                      habit={habit}
                      isCompleted={isCompleted(habit.id, today)}
                      onToggle={() => toggleCompletion(habit.id, today, !isCompleted(habit.id, today))}
                    />
                  </div>
                ))}
                {habits.length > 5 && (
                  <Link href="/habits">
                    <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-primary">
                      View all {habits.length} habits
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-2 border-primary/5 shadow-md flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle>Quick Mood Check</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {todayMood?.mood ? (
              <div className="text-center py-4">
                <div className="text-6xl animate-wiggle mb-4 filter drop-shadow-lg">{MOOD_EMOJIS[todayMood.mood]}</div>
                <p className="mt-2 text-xl font-medium text-foreground">
                  You&apos;re feeling <span className="text-primary font-bold">{['', 'awful', 'bad', 'okay', 'good', 'great'][todayMood.mood]}</span> today
                </p>
                <Link href="/mood">
                  <Button variant="outline" className="mt-6 rounded-full hover:bg-primary hover:text-white transition-all">
                    Update Mood
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="w-full">
                 <p className="text-center text-muted-foreground mb-6">How are you feeling right now?</p>
                 <MoodPicker
                   onSave={handleSaveMood}
                   compact
                 />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
