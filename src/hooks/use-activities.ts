import { useState, useEffect, useCallback } from 'react'
import { Activity } from '@/types/database'

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/garmin/activities')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const data = await res.json()
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const syncActivities = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/garmin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: 0, limit: 50 }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Sync failed')
      }
      
      await fetchActivities()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchActivities()
      setLoading(false)
    }
    init()
  }, [fetchActivities])

  return {
    activities,
    loading,
    syncing,
    error,
    syncActivities,
  }
}
