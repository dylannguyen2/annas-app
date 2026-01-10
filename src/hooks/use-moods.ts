'use client'

import useSWR, { mutate } from 'swr'
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

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getMoodsKey = () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return `/api/moods?start=${formatDate(oneYearAgo)}&end=${formatDate(new Date())}`
}

export function useMoods() {
  const { data: moods = [], error, isLoading: loading } = useSWR<Mood[]>(
    getMoodsKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

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
      const errorData = await res.json().catch(() => ({}))
      if (res.status === 401) throw new Error('Please log in to save your mood')
      throw new Error(errorData.error || 'Failed to save mood')
    }
    const newMood = await res.json()
    
    const key = getMoodsKey()
    const exists = moods.find(m => m.date === data.date)
    if (exists) {
      mutate(key, moods.map(m => m.date === data.date ? newMood : m), false)
    } else {
      mutate(key, [newMood, ...moods], false)
    }
    
    return newMood
  }

  const getMoodForDate = (date: string): Mood | undefined => {
    return moods.find(m => m.date === date)
  }

  const getTodayMood = (): Mood | undefined => {
    return getMoodForDate(formatDate(new Date()))
  }

  return {
    moods,
    loading,
    error: error?.message || null,
    saveMood,
    getMoodForDate,
    getTodayMood,
    refetch: () => mutate(getMoodsKey()),
  }
}
