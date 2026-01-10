'use client'

import { useState, useEffect, useCallback } from 'react'

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

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkouts = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts')
      if (!res.ok) throw new Error('Failed to fetch workouts')
      const data = await res.json()
      setWorkouts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

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
    if (!res.ok) throw new Error('Failed to create workout')
    const newWorkout = await res.json()
    setWorkouts(prev => [newWorkout, ...prev])
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
    setWorkouts(prev => prev.map(w => w.id === id ? updated : w))
    return updated
  }

  const deleteWorkout = async (id: string) => {
    const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete workout')
    setWorkouts(prev => prev.filter(w => w.id !== id))
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchWorkouts()
      setLoading(false)
    }
    init()
  }, [fetchWorkouts])

  return {
    workouts,
    loading,
    error,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refetch: fetchWorkouts,
  }
}
