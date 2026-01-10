'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate } from '@/lib/utils/dates'

interface Mood {
  id: string
  user_id: string
  date: string
  mood: number | null
  energy: number | null
  stress: number | null
  notes: string | null
  tags: string[] | null
  created_at: string
}

export function useMoods() {
  const [moods, setMoods] = useState<Mood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMoods = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start', startDate)
      if (endDate) params.set('end', endDate)
      
      const res = await fetch(`/api/moods?${params}`)
      if (!res.ok) throw new Error('Failed to fetch moods')
      const data = await res.json()
      setMoods(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const saveMood = async (data: {
    date: string
    mood?: number
    energy?: number
    stress?: number
    notes?: string
    tags?: string[]
  }) => {
    const res = await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) throw new Error('Please log in to save your mood')
      throw new Error(data.error || 'Failed to save mood')
    }
    const newMood = await res.json()
    
    setMoods(prev => {
      const exists = prev.find(m => m.date === data.date)
      if (exists) {
        return prev.map(m => m.date === data.date ? newMood : m)
      }
      return [newMood, ...prev]
    })
    
    return newMood
  }

  const getMoodForDate = (date: string): Mood | undefined => {
    return moods.find(m => m.date === date)
  }

  const getTodayMood = (): Mood | undefined => {
    return getMoodForDate(formatDate(new Date()))
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      await fetchMoods(formatDate(thirtyDaysAgo), formatDate(new Date()))
      setLoading(false)
    }
    init()
  }, [fetchMoods])

  return {
    moods,
    loading,
    error,
    saveMood,
    getMoodForDate,
    getTodayMood,
    refetch: fetchMoods,
  }
}
