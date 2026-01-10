'use client'

import { useWorkouts } from '@/hooks/use-workouts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkoutForm } from '@/components/forms/workout-form'
import { formatDisplayDate } from '@/lib/utils/dates'
import { Loader2, Trash2, Clock, Flame } from 'lucide-react'

const WORKOUT_ICONS: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  weights: '🏋️',
  yoga: '🧘',
  hiit: '💪',
  walking: '🚶',
  sports: '⚽',
  other: '🎯',
}

const INTENSITY_COLORS: Record<string, string> = {
  light: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-orange-100 text-orange-800',
  intense: 'bg-red-100 text-red-800',
}

export default function WorkoutsPage() {
  const { workouts, loading, createWorkout, deleteWorkout } = useWorkouts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo
  })

  const totalMinutesThisWeek = thisWeekWorkouts.reduce((acc, w) => acc + (w.duration_minutes || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workouts</h2>
          <p className="text-muted-foreground">
            Track your exercise and training
          </p>
        </div>
        <WorkoutForm onSubmit={createWorkout} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-muted-foreground">workouts logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMinutesThisWeek}</div>
            <p className="text-xs text-muted-foreground">minutes this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
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
          <CardTitle>Workout History</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start logging your workouts to track your progress!
              </p>
              <WorkoutForm
                onSubmit={createWorkout}
                trigger={<Button size="lg">Log Your First Workout</Button>}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {WORKOUT_ICONS[workout.workout_type] || '🎯'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium capitalize">
                          {workout.workout_type.replace('_', ' ')}
                        </h4>
                        {workout.intensity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${INTENSITY_COLORS[workout.intensity]}`}>
                            {workout.intensity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDisplayDate(workout.date)}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {workout.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {workout.duration_minutes} min
                          </span>
                        )}
                      </div>
                      {workout.notes && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          {workout.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteWorkout(workout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
