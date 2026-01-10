'use client'

import { useState, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { Activity } from '@/types/database'

interface ManualWorkout {
  id: string
  user_id: string
  date: string
  workout_type: string
  duration_minutes: number | null
  calories: number | null
  intensity: 'light' | 'moderate' | 'hard' | 'intense' | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface UnifiedWorkout {
  id: string
  source: 'garmin' | 'manual'
  name: string
  type: string
  date: string
  startTime: string | null
  durationSeconds: number | null
  durationMinutes: number | null
  distanceMeters: number | null
  calories: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  steps: number | null
  intensity: string | null
  notes: string | null
  rawActivity?: Activity
  rawWorkout?: ManualWorkout
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const ACTIVITIES_KEY = '/api/garmin/activities'
const WORKOUTS_KEY = '/api/workouts'

export function useAllWorkouts() {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: activities = [], isLoading: activitiesLoading } = useSWR<Activity[]>(
    ACTIVITIES_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const { data: manualWorkouts = [], isLoading: workoutsLoading } = useSWR<ManualWorkout[]>(
    WORKOUTS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const loading = activitiesLoading || workoutsLoading

  const syncGarmin = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/garmin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: 0, limit: 50 }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Sync failed')
      }
      mutate(ACTIVITIES_KEY)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  const createWorkout = async (data: {
    date: string
    workout_type: string
    duration_minutes?: number
    calories?: number
    intensity?: 'light' | 'moderate' | 'hard' | 'intense'
    notes?: string
  }) => {
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create workout')
    }
    const newWorkout = await res.json()
    mutate(WORKOUTS_KEY, [newWorkout, ...manualWorkouts], false)
    return newWorkout
  }

  const deleteWorkout = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete workout')
    mutate(WORKOUTS_KEY, manualWorkouts.filter(w => w.id !== id), false)
  }

  const unifiedWorkouts = useMemo((): UnifiedWorkout[] => {
    return [
      ...activities.map((a): UnifiedWorkout => ({
        id: a.id,
        source: 'garmin',
        name: a.activity_name || 'Untitled',
        type: a.activity_type || 'other',
        date: a.start_time?.split('T')[0] || '',
        startTime: a.start_time,
        durationSeconds: a.duration_seconds,
        durationMinutes: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
        distanceMeters: a.distance_meters,
        calories: a.calories,
        avgHeartRate: a.avg_heart_rate,
        maxHeartRate: a.max_heart_rate,
        steps: a.steps,
        intensity: null,
        notes: null,
        rawActivity: a,
      })),
      ...manualWorkouts.map((w): UnifiedWorkout => ({
        id: w.id,
        source: 'manual',
        name: w.workout_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: w.workout_type,
        date: w.date,
        startTime: null,
        durationSeconds: w.duration_minutes ? w.duration_minutes * 60 : null,
        durationMinutes: w.duration_minutes,
        distanceMeters: null,
        calories: w.calories,
        avgHeartRate: null,
        maxHeartRate: null,
        steps: null,
        intensity: w.intensity,
        notes: w.notes,
        rawWorkout: w,
      })),
    ].sort((a, b) => {
      const dateA = a.startTime || a.date
      const dateB = b.startTime || b.date
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }, [activities, manualWorkouts])

  return {
    workouts: unifiedWorkouts,
    activities,
    manualWorkouts,
    loading,
    syncing,
    error,
    syncGarmin,
    createWorkout,
    deleteWorkout,
    refetch: () => {
      mutate(ACTIVITIES_KEY)
      mutate(WORKOUTS_KEY)
    },
  }
}
