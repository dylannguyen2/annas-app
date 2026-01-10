'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useWorkouts } from '@/hooks/use-workouts'
import { useHealth } from '@/hooks/use-health'
import { formatDate } from '@/lib/utils/dates'
import { Loader2, Smile, Target, Dumbbell, Moon, Footprints, Heart } from 'lucide-react'

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
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { habits, completions, loading: habitsLoading, isCompleted } = useHabits()
  const { moods, loading: moodsLoading } = useMoods()
  const { workouts, loading: workoutsLoading } = useWorkouts()
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">History</h2>
        <p className="text-muted-foreground">
          View your past entries and data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[350px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Underlined dates have logged data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-AU', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'Select a date'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedDate ? (
              <p className="text-muted-foreground">Select a date to view details</p>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Mood</span>
                  </div>
                  {selectedMood?.mood ? (
                    <div className="pl-7 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{MOOD_EMOJIS[selectedMood.mood]}</span>
                        <div>
                          <p className="font-medium">{MOOD_LABELS[selectedMood.mood]}</p>
                          <p className="text-sm text-muted-foreground">
                            Energy: {selectedMood.energy}/5 · Stress: {selectedMood.stress}/5
                          </p>
                        </div>
                      </div>
                      {selectedMood.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          &quot;{selectedMood.notes}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="pl-7 text-sm text-muted-foreground">No mood logged</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Habits</span>
                    {habits.length > 0 && (
                      <Badge variant="secondary">
                        {selectedHabitsCompleted.length}/{habits.length}
                      </Badge>
                    )}
                  </div>
                  {habits.length > 0 ? (
                    <div className="pl-7 space-y-1">
                      {habits.map(habit => {
                        const completed = isCompleted(habit.id, selectedDateStr)
                        return (
                          <div 
                            key={habit.id} 
                            className={`flex items-center gap-2 text-sm ${
                              completed ? '' : 'text-muted-foreground'
                            }`}
                          >
                            <span>{completed ? '✓' : '○'}</span>
                            <span className={habit.color ? '' : ''}>
                              {habit.icon} {habit.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="pl-7 text-sm text-muted-foreground">No habits created</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Workouts</span>
                    {selectedWorkouts.length > 0 && (
                      <Badge variant="secondary">{selectedWorkouts.length}</Badge>
                    )}
                  </div>
                  {selectedWorkouts.length > 0 ? (
                    <div className="pl-7 space-y-2">
                      {selectedWorkouts.map(workout => (
                        <div key={workout.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <span>{WORKOUT_ICONS[workout.workout_type] || '💪'}</span>
                            <span className="font-medium capitalize">{workout.workout_type}</span>
                            {workout.duration_minutes && (
                              <span className="text-muted-foreground">
                                · {workout.duration_minutes} min
                              </span>
                            )}
                          </div>
                          {workout.notes && (
                            <p className="text-muted-foreground mt-1 pl-6">
                              {workout.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-7 text-sm text-muted-foreground">No workouts logged</p>
                  )}
                </div>

                {selectedHealth && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Health (Garmin)</span>
                    </div>
                    <div className="pl-7 grid grid-cols-2 gap-4 text-sm">
                      {selectedHealth.sleep_duration_seconds && (
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-muted-foreground" />
                          <span>Sleep: {formatSleepDuration(selectedHealth.sleep_duration_seconds)}</span>
                        </div>
                      )}
                      {selectedHealth.steps && (
                        <div className="flex items-center gap-2">
                          <Footprints className="h-4 w-4 text-muted-foreground" />
                          <span>Steps: {selectedHealth.steps.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedHealth.resting_heart_rate && (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>Resting HR: {selectedHealth.resting_heart_rate} bpm</span>
                        </div>
                      )}
                      {selectedHealth.total_calories && (
                        <div className="flex items-center gap-2">
                          <span>🔥</span>
                          <span>Calories: {selectedHealth.total_calories.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedMood && selectedHabitsCompleted.length === 0 && selectedWorkouts.length === 0 && !selectedHealth && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No data logged for this day</p>
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
