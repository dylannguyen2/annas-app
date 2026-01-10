'use client'

import useSWR, { mutate } from 'swr'
import { formatDate } from '@/lib/utils/dates'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface Meal {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  photo_url: string | null
  photo_urls: string[]
  description: string | null
  location: string | null
  notes: string | null
  pinned: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getMealsKey = () => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return `/api/meals?start=${formatDate(thirtyDaysAgo)}&end=${formatDate(new Date())}`
}

export function useMeals() {
  const { data: meals = [], error, isLoading: loading } = useSWR<Meal[]>(
    getMealsKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

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
    photo_urls?: string[]
    description?: string
    location?: string
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
    mutate(getMealsKey(), [newMeal, ...meals], false)
    return newMeal
  }

  const updateMeal = async (id: string, data: {
    date?: string
    meal_type?: MealType
    photo_url?: string | null
    photo_urls?: string[]
    description?: string
    location?: string
    notes?: string
    pinned?: boolean
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
    mutate(getMealsKey(), meals.map(m => m.id === id ? updated : m), false)
    return updated
  }

  const deleteMeal = async (id: string) => {
    const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete meal')
    mutate(getMealsKey(), meals.filter(m => m.id !== id), false)
  }

  const getMealsForDate = (date: string): Meal[] => {
    return meals.filter(m => m.date === date)
  }

  const getTodayMeals = (): Meal[] => {
    return getMealsForDate(formatDate(new Date()))
  }

  const getPinnedMeals = (): Meal[] => {
    return meals.filter(m => m.pinned)
  }

  const togglePin = async (id: string) => {
    const meal = meals.find(m => m.id === id)
    if (!meal) return
    return updateMeal(id, { pinned: !meal.pinned })
  }

  return {
    meals,
    loading,
    error: error?.message || null,
    uploadPhoto,
    createMeal,
    updateMeal,
    deleteMeal,
    getMealsForDate,
    getTodayMeals,
    getPinnedMeals,
    togglePin,
    refetch: () => mutate(getMealsKey()),
  }
}
