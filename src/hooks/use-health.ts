'use client'

import { useState, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { formatDate } from '@/lib/utils/dates'

interface HealthData {
  id: string
  user_id: string
  date: string
  sleep_start: string | null
  sleep_end: string | null
  sleep_duration_seconds: number | null
  deep_sleep_seconds: number | null
  light_sleep_seconds: number | null
  rem_sleep_seconds: number | null
  awake_seconds: number | null
  steps: number | null
  distance_meters: number | null
  active_calories: number | null
  total_calories: number | null
  resting_heart_rate: number | null
  min_heart_rate: number | null
  max_heart_rate: number | null
  avg_heart_rate: number | null
  synced_at: string
}

interface GarminStatus {
  connected: boolean
  lastSync: string | null
  connectedAt?: string
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getHealthKey = () => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return `/api/health?start=${formatDate(thirtyDaysAgo)}&end=${formatDate(new Date())}`
}

const GARMIN_STATUS_KEY = '/api/garmin/status'

export function useHealth() {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: healthData = [], isLoading: healthLoading } = useSWR<HealthData[]>(
    getHealthKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const { data: garminStatus = { connected: false, lastSync: null }, isLoading: statusLoading } = useSWR<GarminStatus>(
    GARMIN_STATUS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const loading = healthLoading || statusLoading

  const connectGarmin = async (email: string, password: string) => {
    const res = await fetch('/api/garmin/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to connect')
    }
    
    mutate(GARMIN_STATUS_KEY)
    return true
  }

  const disconnectGarmin = async () => {
    const res = await fetch('/api/garmin/status', { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to disconnect')
    mutate(GARMIN_STATUS_KEY, { connected: false, lastSync: null }, false)
  }

  const syncGarmin = async (date?: string) => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Sync failed')
      }
      
      mutate(GARMIN_STATUS_KEY)
      mutate(getHealthKey())
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  const getTodayHealth = useMemo((): HealthData | undefined => {
    return healthData.find(h => h.date === formatDate(new Date()))
  }, [healthData])

  const formatSleepDuration = (seconds: number | null): string => {
    if (!seconds) return '--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return {
    healthData,
    garminStatus,
    loading,
    syncing,
    error,
    connectGarmin,
    disconnectGarmin,
    syncGarmin,
    getTodayHealth,
    formatSleepDuration,
    refetch: () => {
      mutate(GARMIN_STATUS_KEY)
      mutate(getHealthKey())
    },
  }
}
