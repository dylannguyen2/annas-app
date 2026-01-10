'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function useHealth() {
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [garminStatus, setGarminStatus] = useState<GarminStatus>({ connected: false, lastSync: null })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGarminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/garmin/status')
      if (!res.ok) throw new Error('Failed to fetch Garmin status')
      const data = await res.json()
      setGarminStatus(data)
    } catch (err) {
      console.error('Error fetching Garmin status:', err)
    }
  }, [])

  const fetchHealthData = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start', startDate)
      if (endDate) params.set('end', endDate)
      
      const res = await fetch(`/api/health?${params}`)
      if (!res.ok) throw new Error('Failed to fetch health data')
      const data = await res.json()
      setHealthData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

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
    
    await fetchGarminStatus()
    return true
  }

  const disconnectGarmin = async () => {
    const res = await fetch('/api/garmin/status', { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to disconnect')
    setGarminStatus({ connected: false, lastSync: null })
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
      
      await Promise.all([fetchGarminStatus(), fetchHealthData()])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  const getTodayHealth = (): HealthData | undefined => {
    return healthData.find(h => h.date === formatDate(new Date()))
  }

  const formatSleepDuration = (seconds: number | null): string => {
    if (!seconds) return '--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      await Promise.all([
        fetchGarminStatus(),
        fetchHealthData(formatDate(thirtyDaysAgo), formatDate(new Date())),
      ])
      setLoading(false)
    }
    init()
  }, [fetchGarminStatus, fetchHealthData])

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
    refetch: () => Promise.all([fetchGarminStatus(), fetchHealthData()]),
  }
}
