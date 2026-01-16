'use client'

import { useMemo, useState, useRef } from 'react'
import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useAllWorkouts } from '@/hooks/use-all-workouts'
import { useHealth } from '@/hooks/use-health'
import { useProfile } from '@/hooks/use-profile'
import { useMeals, type MealType } from '@/hooks/use-meals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HabitToggle } from '@/components/dashboard/habit-toggle'
import { HabitForm } from '@/components/forms/habit-form'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { MoodHeatmap } from '@/components/charts'
import { CircularHabitTracker } from '@/components/dashboard/circular-habit-tracker'
import { Moon, Footprints, Plus, ArrowRight, Dumbbell, Sun, Sparkles, Activity, Smile, Camera, UtensilsCrossed, Zap, BarChart3, Upload, Loader2 } from 'lucide-react'
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

const MEAL_INFO: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'Breakfast', icon: '🌅' },
  lunch: { label: 'Lunch', icon: '☀️' },
  dinner: { label: 'Dinner', icon: '🌙' },
  snack: { label: 'Snack', icon: '🍎' },
}

const getCurrentMealType = (): { type: MealType; label: string; timeRange: string } | null => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return { type: 'breakfast', label: 'Breakfast', timeRange: '6am - 11am' }
  if (hour >= 11 && hour < 15) return { type: 'lunch', label: 'Lunch', timeRange: '11am - 3pm' }
  if (hour >= 17 && hour < 21) return { type: 'dinner', label: 'Dinner', timeRange: '5pm - 9pm' }
  return null
}

const getRelevantMeals = (): MealType[] => {
  const hour = new Date().getHours()
  if (hour < 6 || hour >= 21) return []
  if (hour < 11) return ['breakfast']
  if (hour < 15) return ['breakfast', 'lunch']
  return ['breakfast', 'lunch', 'dinner']
}

const DASHBOARD_TABS = [
  { id: 'actions', label: 'Actions', icon: Zap },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
] as const

type DashboardTab = typeof DASHBOARD_TABS[number]['id']

export default function DashboardPage() {
  const { habits, completions, loading: habitsLoading, createHabit, toggleCompletion, isCompleted } = useHabits()
  const { moods, loading: moodsLoading, saveMood, getTodayMood } = useMoods()
  const { workouts, loading: workoutsLoading } = useAllWorkouts()
  const { garminStatus, getTodayHealth, formatSleepDuration, loading: healthLoading } = useHealth()
  const { displayName } = useProfile()
  const { getTodayMeals, loading: mealsLoading, uploadPhoto, createMeal } = useMeals()
  
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [uploading, setUploading] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const pendingMealTypeRef = useRef<MealType | null>(null)

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

  const loading = habitsLoading || moodsLoading || workoutsLoading || healthLoading || mealsLoading

  const currentMeal = getCurrentMealType()
  const todayMeals = getTodayMeals()
  const relevantMeals = getRelevantMeals()
  const missingMeals = relevantMeals.filter(type => !todayMeals.some(m => m.meal_type === type))
  const hasMealLogged = currentMeal ? todayMeals.some(m => m.meal_type === currentMeal.type) : true
  const otherMissingMeals = missingMeals.filter(type => type !== currentMeal?.type)

  const [activeTab, setActiveTab] = useState<DashboardTab>('actions')

  const handleMealCapture = (mealType: MealType) => {
    pendingMealTypeRef.current = mealType
    cameraInputRef.current?.click()
  }

  const handleMealUpload = (mealType: MealType) => {
    pendingMealTypeRef.current = mealType
    uploadInputRef.current?.click()
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingMealTypeRef.current) return

    setUploading(true)
    try {
      const url = await uploadPhoto(file)
      await createMeal({
        date: formatDate(new Date()),
        meal_type: pendingMealTypeRef.current,
        photo_url: url,
      })
    } catch (err) {
      console.error('Failed to save meal:', err)
    } finally {
      setUploading(false)
      pendingMealTypeRef.current = null
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }

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

      <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mt-2">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-hidden whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelected}
        className="hidden"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />

      {activeTab === 'actions' && (
        <div className="space-y-6">
          {missingMeals.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {missingMeals.map((mealType) => {
                const isCurrent = currentMeal?.type === mealType
                const info = MEAL_INFO[mealType]
                
                return (
                  <Card 
                    key={mealType}
                    className={cn(
                      "relative overflow-hidden flex-shrink-0 snap-start transition-all min-w-[200px]",
                      isCurrent 
                        ? "border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 shadow-md" 
                        : "border-border/50 bg-card hover:border-primary/20"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Now
                        </span>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{info.label}</h3>
                          {isCurrent && currentMeal && (
                            <p className="text-xs text-muted-foreground">{currentMeal.timeRange}</p>
                          )}
                        </div>
                      </div>
                      
                      {isCurrent ? (
                        <Button
                          size="sm"
                          className="w-full rounded-full gap-2"
                          onClick={() => handleMealCapture(mealType)}
                          disabled={uploading}
                        >
                          {uploading && pendingMealTypeRef.current === mealType ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          Take Photo
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-full gap-1.5 text-xs"
                            onClick={() => handleMealCapture(mealType)}
                            disabled={uploading}
                          >
                            {uploading && pendingMealTypeRef.current === mealType ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Camera className="h-3.5 w-3.5" />
                            )}
                            Photo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-full gap-1.5 text-xs"
                            onClick={() => handleMealUpload(mealType)}
                            disabled={uploading}
                          >
                            {uploading && pendingMealTypeRef.current === mealType ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            Upload
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="space-y-6 md:hidden">
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
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">Start Your Journey</h3>
                    <p className="text-muted-foreground mb-4 text-xs">
                      Small habits lead to big changes.
                    </p>
                    <HabitForm
                      onSubmit={createHabit}
                      trigger={
                        <Button size="sm" className="rounded-full">
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
              <CardContent className="flex items-center justify-center min-h-[140px]">
                {todayMood?.mood ? (
                  <div className="text-center">
                    <div className="text-4xl mb-3">{MOOD_EMOJIS[todayMood.mood]}</div>
                    <p className="text-base font-medium text-foreground">
                      Feeling <span className="text-primary">{['', 'awful', 'bad', 'okay', 'good', 'great'][todayMood.mood]}</span>
                    </p>
                    <Link href="/mood">
                      <Button variant="outline" size="sm" className="mt-3 rounded-full">
                        Update
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="w-full">
                     <p className="text-center text-muted-foreground mb-4 text-sm">How are you feeling?</p>
                     <MoodPicker onSave={handleSaveMood} compact />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <div className="space-y-6">
              {missingMeals.map((mealType) => {
                const isCurrent = currentMeal?.type === mealType
                const info = MEAL_INFO[mealType]
                
                return (
                  <Card 
                    key={mealType}
                    className={cn(
                      "relative overflow-hidden transition-all",
                      isCurrent 
                        ? "border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 shadow-md" 
                        : "border-border/50 bg-card hover:border-primary/20"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Now
                        </span>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{info.label}</h3>
                          {isCurrent && currentMeal && (
                            <p className="text-xs text-muted-foreground">{currentMeal.timeRange}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isCurrent ? "default" : "outline"}
                          className="flex-1 rounded-full gap-1.5 text-xs"
                          onClick={() => handleMealCapture(mealType)}
                          disabled={uploading}
                        >
                          {uploading && pendingMealTypeRef.current === mealType ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Camera className="h-3.5 w-3.5" />
                          )}
                          Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full gap-1.5 text-xs"
                          onClick={() => handleMealUpload(mealType)}
                          disabled={uploading}
                        >
                          {uploading && pendingMealTypeRef.current === mealType ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Upload
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

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
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-1 text-sm">Start Your Journey</h3>
                      <p className="text-muted-foreground mb-4 text-xs">
                        Small habits lead to big changes.
                      </p>
                      <HabitForm
                        onSubmit={createHabit}
                        trigger={
                          <Button size="sm" className="rounded-full">
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
            </div>

            <Card className="h-fit">
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

            <CircularHabitTracker 
              habits={habits} 
              completions={completions} 
              isCompleted={isCompleted}
            />
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                <Smile className="w-32 h-32" />
              </div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Mood</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-foreground flex items-center gap-2">
                  {todayMood?.mood ? MOOD_EMOJIS[todayMood.mood] : '--'}
                  <span className="text-base font-medium text-muted-foreground">
                    {todayMood?.mood ? ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][todayMood.mood] : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
                  {todayMood ? `Energy: ${todayMood.energy}/5` : 'No log yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                <Dumbbell className="w-32 h-32" />
              </div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workouts</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-foreground">{thisWeekWorkouts.length}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">Sessions this week</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                <Moon className="w-32 h-32" />
              </div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sleep</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-foreground">
                  {garminStatus.connected && todayHealth?.sleep_duration_seconds 
                    ? formatSleepDuration(todayHealth.sleep_duration_seconds)
                    : '--'}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
                  {garminStatus.connected ? 'From Garmin' : 'Connect device'}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                <Footprints className="w-32 h-32" />
              </div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-foreground">
                  {garminStatus.connected && todayHealth?.steps 
                    ? todayHealth.steps.toLocaleString() 
                    : '--'}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
                  {garminStatus.connected ? 'Keep moving!' : 'Connect device'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
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
        </div>
      )}
    </div>
  )
}
