'use client'

import { useMemo } from 'react'
import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useAllWorkouts } from '@/hooks/use-all-workouts'
import { useHealth } from '@/hooks/use-health'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HabitToggle } from '@/components/dashboard/habit-toggle'
import { HabitForm } from '@/components/forms/habit-form'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { MoodHeatmap } from '@/components/charts'
import { CircularHabitTracker } from '@/components/dashboard/circular-habit-tracker'
import { Moon, Footprints, Plus, ArrowRight, Dumbbell, Sun, Sparkles, TrendingUp, Activity, Smile } from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 5) return { text: "Good night", subtitle: "Rest is just as important as action.", icon: Moon }
  if (hour < 12) return { text: "Good morning", subtitle: "Ready to make today wonderful?", icon: Sun }
  if (hour < 18) return { text: "Good afternoon", subtitle: "Keeping the momentum going.", icon: Sun }
  return { text: "Good evening", subtitle: "Time to unwind and reflect.", icon: Moon }
}

export default function DashboardPage() {
  const { habits, completions, loading: habitsLoading, createHabit, toggleCompletion, isCompleted } = useHabits()
  const { moods, loading: moodsLoading, saveMood, getTodayMood } = useMoods()
  const { workouts, loading: workoutsLoading } = useAllWorkouts()
  const { garminStatus, getTodayHealth, formatSleepDuration, loading: healthLoading } = useHealth()
  const { displayName } = useProfile()

  const today = formatDate(new Date())
  const completedToday = habits.filter(h => isCompleted(h.id, today)).length
  const totalHabits = habits.length
  const todayMood = getTodayMood()
  const todayHealth = getTodayHealth
  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = w.startTime ? parseISO(w.startTime) : new Date(w.date + 'T00:00:00')
    return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd })
  })

  const handleSaveMood = async (data: { mood: number; energy: number; stress: number; notes?: string; date: Date }) => {
    await saveMood({ date: formatDate(data.date), mood: data.mood, energy: data.energy, stress: data.stress, notes: data.notes })
  }

  const loading = habitsLoading || moodsLoading || workoutsLoading || healthLoading

  const moodHeatmapData = useMemo(() => {
    return moods
      .filter(m => m.mood !== null)
      .map(m => ({ date: m.date, mood: m.mood as number }))
  }, [moods])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            {format(now, 'EEEE, MMMM do')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {greeting.text}{displayName && <>, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{displayName}</span></>}
          </h2>
          <p className="text-muted-foreground text-lg mt-2 flex items-center gap-2">
            {greeting.subtitle}
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Mood</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Smile className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground flex items-center gap-2">
              {todayMood?.mood ? MOOD_EMOJIS[todayMood.mood] : '--'}
              <span className="text-base font-medium text-muted-foreground">
                {todayMood?.mood ? ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][todayMood.mood] : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayMood ? `Energy: ${todayMood.energy}/5` : 'No log yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workouts</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Sessions this week</p>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sleep</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Moon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {garminStatus.connected && todayHealth?.sleep_duration_seconds 
                ? formatSleepDuration(todayHealth.sleep_duration_seconds)
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {garminStatus.connected ? 'From Garmin' : 'Connect device'}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Steps</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Footprints className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {garminStatus.connected && todayHealth?.steps 
                ? todayHealth.steps.toLocaleString() 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {garminStatus.connected ? 'Keep moving!' : 'Connect device'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
           <CircularHabitTracker 
             habits={habits} 
             completions={completions} 
             isCompleted={isCompleted}
           />
           
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="flex items-center gap-2 text-base">
                 <Activity className="h-4 w-4 text-primary" />
                 Mood History
               </CardTitle>
             </CardHeader>
             <CardContent>
               {moods.length > 0 ? (
                 <MoodHeatmap data={moodHeatmapData} />
               ) : (
                 <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm flex-col gap-3">
                   <p>No mood data yet</p>
                   <Button variant="outline" size="sm" asChild className="rounded-full">
                     <Link href="/mood">Log first mood</Link>
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <CardTitle>Today&apos;s Habits</CardTitle>
                {totalHabits > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {completedToday}/{totalHabits}
                  </span>
                )}
              </div>
              {totalHabits > 0 && (
                <HabitForm
                  onSubmit={createHabit}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              )}
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-1">Start Your Journey</h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Small habits lead to big changes.
                  </p>
                  <HabitForm
                    onSubmit={createHabit}
                    trigger={
                      <Button className="rounded-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Habit
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.slice(0, 5).map((habit) => (
                    <div 
                      key={habit.id} 
                      className="transition-colors hover:bg-muted/50 rounded-lg -mx-2 px-2"
                    >
                      <HabitToggle
                        habit={habit}
                        isCompleted={isCompleted(habit.id, today)}
                        onToggle={() => toggleCompletion(habit.id, today, !isCompleted(habit.id, today))}
                      />
                    </div>
                  ))}
                  {habits.length > 5 && (
                    <Link href="/habits" className="block pt-2">
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-primary">
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-primary" />
                Quick Mood Check
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[180px]">
              {todayMood?.mood ? (
                <div className="text-center">
                  <div className="text-5xl mb-4">{MOOD_EMOJIS[todayMood.mood]}</div>
                  <p className="text-lg font-medium text-foreground">
                    Feeling <span className="text-primary">{['', 'awful', 'bad', 'okay', 'good', 'great'][todayMood.mood]}</span>
                  </p>
                  <Link href="/mood">
                    <Button variant="outline" size="sm" className="mt-4 rounded-full">
                      Update
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="w-full">
                   <p className="text-center text-muted-foreground mb-6">How are you feeling?</p>
                   <MoodPicker onSave={handleSaveMood} compact />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
