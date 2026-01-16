'use client'

import { useState, useMemo, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import useSWRInfinite from 'swr/infinite'
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

interface PaginatedResponse<T> {
  data: T[]
  total: number
  hasMore: boolean
  offset: number
  limit: number
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const PAGE_SIZE = 20

export function useAllWorkouts() {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getActivitiesKey = (pageIndex: number, previousPageData: PaginatedResponse<Activity> | null) => {
    if (previousPageData && !previousPageData.hasMore) return null
    const offset = pageIndex * PAGE_SIZE
    return `/api/garmin/activities?offset=${offset}&limit=${PAGE_SIZE}`
  }

  const {
    data: activitiesPages,
    size: activitiesSize,
    setSize: setActivitiesSize,
    isLoading: activitiesLoading,
    isValidating: activitiesValidating,
    mutate: mutateActivities,
  } = useSWRInfinite<PaginatedResponse<Activity>>(
    getActivitiesKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000, revalidateFirstPage: false }
  )

  const getWorkoutsKey = (pageIndex: number, previousPageData: PaginatedResponse<ManualWorkout> | null) => {
    if (previousPageData && !previousPageData.hasMore) return null
    const offset = pageIndex * PAGE_SIZE
    return `/api/workouts?offset=${offset}&limit=${PAGE_SIZE}`
  }

  const {
    data: workoutsPages,
    size: workoutsSize,
    setSize: setWorkoutsSize,
    isLoading: workoutsLoading,
    isValidating: workoutsValidating,
    mutate: mutateWorkouts,
  } = useSWRInfinite<PaginatedResponse<ManualWorkout>>(
    getWorkoutsKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000, revalidateFirstPage: false }
  )

  const activities = useMemo(() => {
    if (!activitiesPages) return []
    return activitiesPages.flatMap(page => page.data || [])
  }, [activitiesPages])

  const manualWorkouts = useMemo(() => {
    if (!workoutsPages) return []
    return workoutsPages.flatMap(page => page.data || [])
  }, [workoutsPages])

  const hasMoreActivities = activitiesPages?.[activitiesPages.length - 1]?.hasMore ?? true
  const hasMoreWorkouts = workoutsPages?.[workoutsPages.length - 1]?.hasMore ?? true
  const hasMore = hasMoreActivities || hasMoreWorkouts

  const loading = activitiesLoading || workoutsLoading
  const loadingMore = activitiesValidating || workoutsValidating

  const totalActivities = activitiesPages?.[0]?.total ?? 0
  const totalWorkouts = workoutsPages?.[0]?.total ?? 0

  const loadMore = useCallback(() => {
    if (hasMoreActivities && !activitiesValidating) {
      setActivitiesSize(activitiesSize + 1)
    }
    if (hasMoreWorkouts && !workoutsValidating) {
      setWorkoutsSize(workoutsSize + 1)
    }
  }, [hasMoreActivities, hasMoreWorkouts, activitiesValidating, workoutsValidating, activitiesSize, workoutsSize, setActivitiesSize, setWorkoutsSize])

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
      mutateActivities()
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
    mutateWorkouts()
    return newWorkout
  }

  const updateWorkout = async (id: string, data: Partial<ManualWorkout>) => {
    const res = await fetch(`/api/workouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update workout')
    }
    const updatedWorkout = await res.json()
    mutateWorkouts()
    return updatedWorkout
  }

  const deleteWorkout = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete workout')
    mutateWorkouts()
  }

  const deleteActivity = async (id: string) => {
    const res = await fetch(`/api/garmin/activities/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete activity')
    mutateActivities()
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
    loadingMore,
    syncing,
    error,
    hasMore,
    totalActivities,
    totalWorkouts,
    loadMore,
    syncGarmin,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    deleteActivity,
    refetch: () => {
      mutateActivities()
      mutateWorkouts()
    },
  }
}
