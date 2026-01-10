'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkoutForm } from '@/components/forms/workout-form'
import { useAllWorkouts, UnifiedWorkout } from '@/hooks/use-all-workouts'
import { RefreshCw, Loader2, Clock, Flame, Heart, Footprints, Trash2, Watch, PenLine, MapPin } from 'lucide-react'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns'

const WORKOUT_ICONS: Record<string, string> = {
  running: '🏃',
  street_running: '🏃',
  treadmill: '🏃‍♂️',
  treadmill_running: '🏃‍♂️',
  indoor_running: '🏃‍♂️',
  cycling: '🚴',
  indoor_cycling: '🚴',
  swimming: '🏊',
  weights: '🏋️',
  strength_training: '🏋️',
  yoga: '🧘',
  'hot-yoga': '🔥',
  pilates: '🤸‍♀️',
  reformer: '🤸‍♀️',
  hiit: '💪',
  walking: '🚶',
  cardio: '💓',
  indoor_cardio: '💓',
  fitness_equipment: '🏋️',
  other: '🎯',
}

const INTENSITY_COLORS: Record<string, string> = {
  light: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  intense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const getWorkoutIcon = (type: string, name: string = '') => {
  const t = type?.toLowerCase() || ''
  const n = name?.toLowerCase() || ''
  const combined = `${t} ${n}`
  
  if (combined.includes('treadmill')) return '🏃‍♂️'
  if (combined.includes('reformer')) return '🤸‍♀️'
  if (combined.includes('hot yoga') || combined.includes('bikram')) return '🔥'
  if (combined.includes('pilates')) return '🤸‍♀️'
  
  return WORKOUT_ICONS[t] || WORKOUT_ICONS[t.replace(/_/g, '')] || '🎯'
}

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

const formatDistance = (meters: number | null) => {
  if (!meters) return null
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

export default function WorkoutsPage() {
  const { workouts, loading, syncing, error, syncGarmin, createWorkout, deleteWorkout } = useAllWorkouts()

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeekWorkouts = workouts.filter(w => {
    const date = w.startTime ? parseISO(w.startTime) : new Date(w.date)
    return isWithinInterval(date, { start: weekStart, end: weekEnd })
  })

  const totalMinutes = thisWeekWorkouts.reduce((acc, w) => acc + (w.durationMinutes || 0), 0)
  const totalCalories = thisWeekWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0)
  const garminCount = thisWeekWorkouts.filter(w => w.source === 'garmin').length
  const manualCount = thisWeekWorkouts.filter(w => w.source === 'manual').length

  const handleSync = async () => {
    try {
      await syncGarmin()
    } catch {
    }
  }

  const handleDelete = async (workout: UnifiedWorkout) => {
    if (workout.source === 'manual') {
      await deleteWorkout(workout.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workouts</h2>
          <p className="text-muted-foreground">
            Synced from Garmin and manual entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync Garmin'}
          </Button>
          <WorkoutForm onSubmit={createWorkout} />
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-muted-foreground">
              {garminCount} synced, {manualCount} manual
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
            <p className="text-xs text-muted-foreground">total this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalories > 0 ? totalCalories.toLocaleString() : '--'}</div>
            <p className="text-xs text-muted-foreground">burned this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">All Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length}</div>
            <p className="text-xs text-muted-foreground">total workouts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">
                Sync from Garmin or log workouts manually
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Garmin
                </Button>
                <WorkoutForm
                  onSubmit={createWorkout}
                  trigger={<Button>Log Workout</Button>}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {workouts.slice(0, 30).map((workout) => (
                <div
                  key={`${workout.source}-${workout.id}`}
                  className="flex items-start justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {getWorkoutIcon(workout.type, workout.name)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{workout.name}</h4>
                        {workout.source === 'garmin' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Watch className="h-2.5 w-2.5" />
                            Garmin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <PenLine className="h-2.5 w-2.5" />
                            Manual
                          </span>
                        )}
                        {workout.intensity && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${INTENSITY_COLORS[workout.intensity]}`}>
                            {workout.intensity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workout.startTime 
                          ? format(parseISO(workout.startTime), 'EEE, MMM d · h:mm a')
                          : format(new Date(workout.date), 'EEE, MMM d')
                        }
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {workout.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(workout.durationMinutes)}
                          </span>
                        )}
                        {formatDistance(workout.distanceMeters) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {formatDistance(workout.distanceMeters)}
                          </span>
                        )}
                        {workout.calories && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5" />
                            {workout.calories} cal
                          </span>
                        )}
                        {workout.avgHeartRate && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {workout.avgHeartRate} bpm
                          </span>
                        )}
                        {workout.steps && workout.steps > 0 && (
                          <span className="flex items-center gap-1">
                            <Footprints className="h-3.5 w-3.5" />
                            {workout.steps.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          {workout.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {workout.source === 'manual' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(workout)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
