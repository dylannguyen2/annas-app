'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useAllWorkouts } from '@/hooks/use-all-workouts'
import { useHealth } from '@/hooks/use-health'
import { formatDate } from '@/lib/utils/dates'
import { Smile, Target, Dumbbell, Moon, Footprints, Heart, Calendar as CalendarIcon } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Awful',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
}

const WORKOUT_ICONS: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  gym: '🏋️',
  yoga: '🧘',
  walking: '🚶',
  'dog-walking': '🐕',
  hiking: '🥾',
  sports: '⚽',
  other: '💪',
  lap_swimming: '🏊',
  open_water_swimming: '🏊',
  indoor_cycling: '🚴',
  virtual_ride: '🚴',
  mountain_biking: '🚵',
  gravel_cycling: '🚴',
  strength_training: '🏋️',
  cardio_training: '💪',
  elliptical: '🏃',
  stair_climbing: '🪜',
  indoor_rowing: '🚣',
  pilates: '🧘',
  breathwork: '🧘',
  hiit: '💪',
  tennis: '🎾',
  pickleball: '🏓',
  golf: '⛳',
  skiing: '⛷️',
  snowboarding: '🏂',
  surfing: '🏄',
  stand_up_paddleboarding: '🏄',
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { habits, completions, loading: habitsLoading, isCompleted } = useHabits()
  const { moods, loading: moodsLoading } = useMoods()
  const { workouts, loading: workoutsLoading } = useAllWorkouts()
  const { healthData, formatSleepDuration, loading: healthLoading } = useHealth()

  const loading = habitsLoading || moodsLoading || workoutsLoading || healthLoading

  const selectedDateStr = selectedDate ? formatDate(selectedDate) : ''

  const datesWithData = useMemo(() => {
    const dates = new Set<string>()
    moods.forEach(m => dates.add(m.date))
    completions.forEach(c => dates.add(c.date))
    workouts.forEach(w => dates.add(w.date))
    healthData.forEach(h => dates.add(h.date))
    return dates
  }, [moods, completions, workouts, healthData])

  const selectedMood = useMemo(() => {
    return moods.find(m => m.date === selectedDateStr)
  }, [moods, selectedDateStr])

  const selectedWorkouts = useMemo(() => {
    return workouts.filter(w => w.date === selectedDateStr)
  }, [workouts, selectedDateStr])

  const selectedHealth = useMemo(() => {
    return healthData.find(h => h.date === selectedDateStr)
  }, [healthData, selectedDateStr])

  const selectedHabitsCompleted = useMemo(() => {
    return habits.filter(h => isCompleted(h.id, selectedDateStr))
  }, [habits, isCompleted, selectedDateStr])

  const modifiers = useMemo(() => {
    const hasData: Date[] = []
    datesWithData.forEach(dateStr => {
      hasData.push(new Date(dateStr + 'T00:00:00'))
    })
    return { hasData }
  }, [datesWithData])

  const modifiersStyles = {
    hasData: {
      fontWeight: 'bold' as const,
      textDecoration: 'underline' as const,
      textDecorationColor: 'hsl(var(--primary))',
      textUnderlineOffset: '4px',
    },
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                <CalendarIcon className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                History
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                View your past entries and data
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[350px_1fr]">
        <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <p className="text-xs text-muted-foreground">
                Underlined dates have logged data
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-xl">
              {selectedDate 
                ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="block">
                        {selectedDate.toLocaleDateString('en-AU', { weekday: 'long' })}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {selectedDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )
                : 'Select a date'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!selectedDate ? (
              <p className="text-muted-foreground">Select a date to view details</p>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                      <Smile className="h-4 w-4 text-yellow-500" />
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Mood</span>
                  </div>
                  {selectedMood?.mood ? (
                    <div className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border/50">
                      <span className="text-4xl">{MOOD_EMOJIS[selectedMood.mood]}</span>
                      <div>
                        <p className="font-semibold text-lg">{MOOD_LABELS[selectedMood.mood]}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Energy: {selectedMood.energy}/5</span>
                          <span>•</span>
                          <span>Stress: {selectedMood.stress}/5</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 italic">No mood logged</p>
                  )}
                  {selectedMood?.notes && (
                    <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-lg">
                      "{selectedMood.notes}"
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <Target className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Habits</span>
                    </div>
                    {habits.length > 0 && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        {selectedHabitsCompleted.length}/{habits.length}
                      </Badge>
                    )}
                  </div>
                  {habits.length > 0 ? (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {habits.map(habit => {
                        const completed = isCompleted(habit.id, selectedDateStr)
                        return (
                          <div 
                            key={habit.id} 
                            className={`flex items-center gap-2.5 p-2 rounded-lg text-sm transition-colors ${
                              completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                              completed ? 'bg-green-500 text-white' : 'bg-muted border border-border'
                            }`}>
                              {completed ? '✓' : ''}
                            </span>
                            <span>{habit.icon}</span>
                            <span className={completed ? 'font-medium' : 'text-muted-foreground'}>{habit.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 italic">No habits created</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/10 rounded-lg">
                        <Dumbbell className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Workouts</span>
                    </div>
                    {selectedWorkouts.length > 0 && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                        {selectedWorkouts.length}
                      </Badge>
                    )}
                  </div>
                  {selectedWorkouts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWorkouts.map(workout => (
                        <div key={workout.id} className="p-3 bg-card rounded-lg border border-border/50">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{WORKOUT_ICONS[workout.type] || '💪'}</span>
                            <span className="font-semibold">{workout.name}</span>
                            {workout.source === 'garmin' && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                Garmin
                              </Badge>
                            )}
                            {workout.durationMinutes && (
                              <Badge variant="secondary" className="ml-auto">
                                {workout.durationMinutes} min
                              </Badge>
                            )}
                          </div>
                          {workout.notes && (
                            <p className="text-sm text-muted-foreground mt-2 pl-7">
                              {workout.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 italic">No workouts logged</p>
                  )}
                </div>

                {selectedHealth && (
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-500/10 rounded-lg">
                        <Heart className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Health (Garmin)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedHealth.sleep_duration_seconds && (
                        <div className="flex items-center gap-2.5 p-3 bg-card rounded-lg border border-border/50">
                          <Moon className="h-4 w-4 text-indigo-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Sleep</p>
                            <p className="font-semibold">{formatSleepDuration(selectedHealth.sleep_duration_seconds)}</p>
                          </div>
                        </div>
                      )}
                      {selectedHealth.steps && (
                        <div className="flex items-center gap-2.5 p-3 bg-card rounded-lg border border-border/50">
                          <Footprints className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Steps</p>
                            <p className="font-semibold">{selectedHealth.steps.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      {selectedHealth.resting_heart_rate && (
                        <div className="flex items-center gap-2.5 p-3 bg-card rounded-lg border border-border/50">
                          <Heart className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Resting HR</p>
                            <p className="font-semibold">{selectedHealth.resting_heart_rate} bpm</p>
                          </div>
                        </div>
                      )}
                      {selectedHealth.total_calories && (
                        <div className="flex items-center gap-2.5 p-3 bg-card rounded-lg border border-border/50">
                          <span className="text-orange-500">🔥</span>
                          <div>
                            <p className="text-xs text-muted-foreground">Calories</p>
                            <p className="font-semibold">{selectedHealth.total_calories.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedMood && selectedHabitsCompleted.length === 0 && selectedWorkouts.length === 0 && !selectedHealth && (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-50" />
                      <div className="relative h-16 w-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-sm mx-auto">
                        <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No data logged</h3>
                    <p className="text-muted-foreground text-sm">Nothing was recorded on this day</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
