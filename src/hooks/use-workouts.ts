'use client'

import useSWR, { mutate } from 'swr'

interface Workout {
  id: string
  user_id: string
  date: string
  workout_type: string
  duration_minutes: number | null
  intensity: 'light' | 'moderate' | 'hard' | 'intense' | null
  notes: string | null
  created_at: string
  updated_at: string
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json().then(json => json.data ?? [])
})

const WORKOUTS_KEY = '/api/workouts'

export function useWorkouts() {
  const { data: workouts = [], error, isLoading: loading } = useSWR<Workout[]>(
    WORKOUTS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const createWorkout = async (data: {
    date: string
    workout_type: string
    duration_minutes?: number
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
    mutate(WORKOUTS_KEY, [newWorkout, ...workouts], false)
    return newWorkout
  }

  const updateWorkout = async (id: string, data: Partial<Workout>) => {
    const res = await fetch(`/api/workouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update workout')
    const updated = await res.json()
    mutate(WORKOUTS_KEY, workouts.map(w => w.id === id ? updated : w), false)
    return updated
  }

  const deleteWorkout = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete workout')
    mutate(WORKOUTS_KEY, workouts.filter(w => w.id !== id), false)
  }

  return {
    workouts,
    loading,
    error: error?.message || null,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refetch: () => mutate(WORKOUTS_KEY),
  }
}
