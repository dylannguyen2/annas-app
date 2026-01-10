'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate } from '@/lib/utils/dates'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface Meal {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  photo_url: string | null
  description: string | null
  notes: string | null
  created_at: string
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeals = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start', startDate)
      if (endDate) params.set('end', endDate)
      
      const res = await fetch(`/api/meals?${params}`)
      if (!res.ok) throw new Error('Failed to fetch meals')
      const data = await res.json()
      setMeals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fetch('/api/meals/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to upload photo')
    }
    
    const data = await res.json()
    return data.url
  }

  const createMeal = async (data: {
    date: string
    meal_type: MealType
    photo_url?: string | null
    description?: string
    notes?: string
  }) => {
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create meal')
    }
    
    const newMeal = await res.json()
    setMeals(prev => [newMeal, ...prev])
    return newMeal
  }

  const updateMeal = async (id: string, data: {
    date?: string
    meal_type?: MealType
    photo_url?: string | null
    description?: string
    notes?: string
  }) => {
    const res = await fetch(`/api/meals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update meal')
    }
    
    const updated = await res.json()
    setMeals(prev => prev.map(m => m.id === id ? updated : m))
    return updated
  }

  const deleteMeal = async (id: string) => {
    const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete meal')
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  const getMealsForDate = (date: string): Meal[] => {
    return meals.filter(m => m.date === date)
  }

  const getTodayMeals = (): Meal[] => {
    return getMealsForDate(formatDate(new Date()))
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      await fetchMeals(formatDate(thirtyDaysAgo), formatDate(new Date()))
      setLoading(false)
    }
    init()
  }, [fetchMeals])

  return {
    meals,
    loading,
    error,
    uploadPhoto,
    createMeal,
    updateMeal,
    deleteMeal,
    getMealsForDate,
    getTodayMeals,
    refetch: fetchMeals,
  }
}
