'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Habit, HabitCompletion } from '@/types/database'
import { formatDate } from '@/lib/utils/dates'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits')
      if (!res.ok) throw new Error('Failed to fetch habits')
      const data = await res.json()
      setHabits(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const fetchCompletions = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start', startDate)
      if (endDate) params.set('end', endDate)
      
      const res = await fetch(`/api/habits/completions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch completions')
      const data = await res.json()
      setCompletions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const createHabit = async (habit: { name: string; icon?: string; color?: string }) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    })
    if (!res.ok) throw new Error('Failed to create habit')
    const newHabit = await res.json()
    setHabits(prev => [...prev, newHabit])
    return newHabit
  }

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    const res = await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update habit')
    const updated = await res.json()
    setHabits(prev => prev.map(h => h.id === id ? updated : h))
    return updated
  }

  const deleteHabit = async (id: string) => {
    const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete habit')
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const toggleCompletion = async (habitId: string, date: string, completed: boolean) => {
    const res = await fetch('/api/habits/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, date, completed }),
    })
    if (!res.ok) throw new Error('Failed to toggle completion')
    
    const result = await res.json()
    
    if (result.deleted) {
      setCompletions(prev => prev.filter(c => !(c.habit_id === habitId && c.date === date)))
    } else {
      setCompletions(prev => {
        const exists = prev.find(c => c.habit_id === habitId && c.date === date)
        if (exists) {
          return prev.map(c => c.habit_id === habitId && c.date === date ? result : c)
        }
        return [...prev, result]
      })
    }
  }

  const isCompleted = (habitId: string, date: string): boolean => {
    return completions.some(c => c.habit_id === habitId && c.date === date && c.completed)
  }

  const getCompletionDates = (habitId: string): string[] => {
    return completions
      .filter(c => c.habit_id === habitId && c.completed)
      .map(c => c.date)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      await Promise.all([
        fetchHabits(),
        fetchCompletions(formatDate(oneYearAgo), formatDate(new Date()))
      ])
      setLoading(false)
    }
    init()
  }, [fetchHabits, fetchCompletions])

  return {
    habits,
    completions,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    isCompleted,
    getCompletionDates,
    refetch: () => Promise.all([fetchHabits(), fetchCompletions()]),
  }
}
