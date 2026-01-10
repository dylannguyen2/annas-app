'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, RefreshCw, Loader2, Calendar, Clock, MapPin, Flame, Heart, Footprints, TrendingUp } from 'lucide-react'
import { useActivities } from '@/hooks/use-activities'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns'

const getActivityIcon = (type: string | null, name: string | null = null) => {
  const t = type?.toLowerCase() || ''
  const n = name?.toLowerCase() || ''
  const combined = `${t} ${n}`
  
  if (combined.includes('treadmill')) return '🏃‍♂️'
  if (combined.includes('reformer') || combined.includes('pilates')) return '🤸‍♀️'
  if (combined.includes('hot yoga') || combined.includes('bikram')) return '🔥'
  if (t.includes('run') || t.includes('running')) return '🏃'
  if (t.includes('cycle') || t.includes('cycling') || t.includes('bike')) return '🚴'
  if (t.includes('swim')) return '🏊'
  if (t.includes('strength') || t.includes('weight')) return '🏋️'
  if (t.includes('yoga')) return '🧘'
  if (t.includes('walk')) return '🚶'
  if (t.includes('hike') || t.includes('hiking')) return '🥾'
  if (t.includes('cardio')) return '💓'
  if (t.includes('hiit')) return '⚡'
  return '🎯'
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const formatDistance = (meters: number | null) => {
  if (!meters) return '--'
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

export default function ActivitiesPage() {
  const { activities, loading, syncing, error, syncActivities } = useActivities()

  const handleSync = async () => {
    try {
      await syncActivities()
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  
  const weekActivities = activities.filter(a => {
    if (!a.start_time) return false
    const date = parseISO(a.start_time)
    return isWithinInterval(date, { start, end })
  })

  const totalDuration = weekActivities.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
  const totalCalories = weekActivities.reduce((acc, curr) => acc + (curr.calories || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activities</h2>
          <p className="text-muted-foreground">Your Garmin activities</p>
        </div>
        <Button variant="outline" onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {syncing ? 'Syncing...' : 'Sync Activities'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              activities this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <p className="text-xs text-muted-foreground">
              total time active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Calories
            </CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalories.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              calories burned
            </p>
          </CardContent>
        </Card>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">No Activities Found</h3>
              <p className="text-muted-foreground mt-1">
                Sync with Garmin to see your activities here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label={activity.activity_type || 'activity'}>
                      {getActivityIcon(activity.activity_type, activity.activity_name)}
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold line-clamp-1">
                        {activity.activity_name || 'Untitled Activity'}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="mr-1 h-3 w-3" />
                        {activity.start_time ? format(parseISO(activity.start_time), 'MMM d, h:mm a') : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(activity.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDistance(activity.distance_meters)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.calories || '--'} cal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {activity.avg_heart_rate ? `${activity.avg_heart_rate}/${activity.max_heart_rate}` : '--'} bpm
                    </span>
                  </div>
                  {activity.steps && activity.steps > 0 && (
                    <div className="flex items-center gap-2 col-span-2 border-t pt-3 mt-1">
                      <Footprints className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.steps.toLocaleString()} steps</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
