'use client'

import useSWR, { mutate } from 'swr'
import type { Habit, HabitCompletion } from '@/types/database'
import { formatDate } from '@/lib/utils/dates'

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getCompletionsKey = () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return `/api/habits/completions?start=${formatDate(oneYearAgo)}&end=${formatDate(new Date())}`
}

export function useHabits() {
  const { data: habits = [], error: habitsError, isLoading: habitsLoading } = useSWR<Habit[]>(
    '/api/habits',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )
  
  const { data: completions = [], error: completionsError, isLoading: completionsLoading } = useSWR<HabitCompletion[]>(
    getCompletionsKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const loading = habitsLoading || completionsLoading
  const error = habitsError?.message || completionsError?.message || null

  const createHabit = async (habit: { name: string; icon?: string; color?: string }) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    })
    if (!res.ok) throw new Error('Failed to create habit')
    const newHabit = await res.json()
    mutate('/api/habits', [...habits, newHabit], false)
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
    mutate('/api/habits', habits.map(h => h.id === id ? updated : h), false)
    return updated
  }

  const deleteHabit = async (id: string) => {
    const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete habit')
    mutate('/api/habits', habits.filter(h => h.id !== id), false)
  }

  const toggleCompletion = async (habitId: string, date: string, completed: boolean) => {
    const res = await fetch('/api/habits/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, date, completed }),
    })
    if (!res.ok) throw new Error('Failed to toggle completion')
    
    const result = await res.json()
    const key = getCompletionsKey()
    
    if (result.deleted) {
      mutate(key, completions.filter(c => !(c.habit_id === habitId && c.date === date)), false)
    } else {
      const exists = completions.find(c => c.habit_id === habitId && c.date === date)
      if (exists) {
        mutate(key, completions.map(c => c.habit_id === habitId && c.date === date ? result : c), false)
      } else {
        mutate(key, [...completions, result], false)
      }
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
    refetch: () => {
      mutate('/api/habits')
      mutate(getCompletionsKey())
    },
  }
}
