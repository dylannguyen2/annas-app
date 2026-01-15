'use client'

import { useMemo } from 'react'
import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useAllWorkouts } from '@/hooks/use-all-workouts'
import { useHealth } from '@/hooks/use-health'
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
    <div className="space-y-10 animate-in-up pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            {format(now, 'EEEE, MMMM do')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {greeting.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Anna</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-2 flex items-center gap-2">
            {greeting.subtitle}
          </p>
        </div>
        <div className="hidden md:block">
           <GreetingIcon className="h-16 w-16 text-yellow-500/20 stroke-[1.5]" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/10 dark:to-rose-950/10 backdrop-blur-xl hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Mood</CardTitle>
            <div className="p-2.5 bg-pink-100/50 dark:bg-pink-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Smile className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-end justify-between">
              <div>
                 <div className="text-3xl font-bold text-foreground flex items-center gap-2">
                  {todayMood?.mood ? MOOD_EMOJIS[todayMood.mood] : '--'}
                  <span className="text-lg font-medium text-muted-foreground/80">
                    {todayMood?.mood ? ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][todayMood.mood] : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                   {todayMood ? `Energy: ${todayMood.energy}/5 • Stress: ${todayMood.stress}/5` : 'No log yet'}
                </p>
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-colors" />
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/10 dark:to-amber-950/10 backdrop-blur-xl hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workouts</CardTitle>
            <div className="p-2.5 bg-orange-100/50 dark:bg-orange-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Dumbbell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Sessions this week
              <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </p>
          </CardContent>
          <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/10 dark:to-blue-950/10 backdrop-blur-xl hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sleep Duration</CardTitle>
            <div className="p-2.5 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground">
              {garminStatus.connected && todayHealth?.sleep_duration_seconds 
                ? formatSleepDuration(todayHealth.sleep_duration_seconds).replace('h ', 'h ').replace('m', 'm')
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {garminStatus.connected ? 'Synced from Garmin' : 'Connect device'}
            </p>
          </CardContent>
          <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Steps</CardTitle>
            <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Footprints className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground">
              {garminStatus.connected && todayHealth?.steps 
                ? todayHealth.steps.toLocaleString() 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
               {garminStatus.connected ? 'Keep moving!' : 'Connect device'}
            </p>
          </CardContent>
          <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[28fr_72fr]">
        <div className="space-y-8">
           <CircularHabitTracker 
             habits={habits} 
             completions={completions} 
             isCompleted={isCompleted}
           />
           
           <Card className="overflow-hidden border-0 bg-card/40 dark:bg-card/20 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-500">
             <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
               <CardTitle className="flex items-center gap-2 text-base">
                 <Activity className="h-4 w-4 text-primary" />
                 Mood History
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-6">
               {moods.length > 0 ? (
                 <MoodHeatmap data={moodHeatmapData} />
               ) : (
                 <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                   <p>No mood data yet</p>
                   <Button variant="outline" size="sm" asChild>
                     <Link href="/mood">Log first mood</Link>
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>

        <div className="grid gap-8 content-start">
          <Card className="overflow-hidden border-0 bg-card/40 dark:bg-card/20 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Today&apos;s Habits</CardTitle>
                {totalHabits > 0 && (
                  <span className="text-xs font-medium px-2.5 py-0.5 bg-primary/10 text-primary rounded-full ring-1 ring-primary/20">
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
            <CardContent className="p-6">
              {habits.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 animate-bounce-subtle">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start Your Journey</h3>
                  <p className="text-muted-foreground mb-8 max-w-[280px] mx-auto text-sm">
                    Small habits lead to big changes. Plant your first seed today!
                  </p>
                  <HabitForm
                    onSubmit={createHabit}
                    trigger={
                      <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300">
                        <Plus className="mr-2 h-5 w-5" />
                        Create First Habit
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.slice(0, 5).map((habit, i) => (
                    <div 
                      key={habit.id} 
                      className="group transform transition-all duration-300 hover:scale-[1.01] hover:bg-muted/30 rounded-xl p-1"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <HabitToggle
                        habit={habit}
                        isCompleted={isCompleted(habit.id, today)}
                        onToggle={() => toggleCompletion(habit.id, today, !isCompleted(habit.id, today))}
                      />
                    </div>
                  ))}
                  {habits.length > 5 && (
                    <Link href="/habits" className="block mt-6">
                      <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        View all {habits.length} habits
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-card/40 to-muted/40 dark:from-card/20 dark:to-muted/10 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Mood Check
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
              {todayMood?.mood ? (
                <div className="text-center w-full">
                  <div className="relative inline-block">
                    <div className="text-7xl animate-wiggle mb-6 filter drop-shadow-xl transform hover:scale-110 transition-transform cursor-default">
                      {MOOD_EMOJIS[todayMood.mood]}
                    </div>
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl -z-10 opacity-50" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-foreground tracking-tight">
                      You&apos;re feeling <span className="text-primary">{['', 'awful', 'bad', 'okay', 'good', 'great'][todayMood.mood]}</span>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Thanks for checking in with yourself.
                    </p>
                  </div>
                  
                  <Link href="/mood">
                    <Button variant="outline" className="mt-8 rounded-full border-primary/20 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                      Update Log
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="w-full max-w-md">
                   <p className="text-center text-muted-foreground mb-8 text-lg font-medium">How are you feeling right now?</p>
                   <div className="bg-background/50 backdrop-blur-sm p-6 rounded-3xl border border-white/20 shadow-inner">
                     <MoodPicker
                       onSave={handleSaveMood}
                       compact
                     />
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
