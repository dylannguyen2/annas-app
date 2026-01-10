'use client'

import { useState, useMemo } from 'react'
import useSWR, { mutate } from 'swr'

interface PeriodLog {
  id: string
  user_id: string
  date: string
  flow_intensity: 'spotting' | 'light' | 'medium' | 'heavy' | null
  symptoms: string[]
  notes: string | null
  is_period_day: boolean
  created_at: string
  updated_at: string
}

interface CycleSettings {
  average_cycle_length: number
  average_period_length: number
}

interface CycleInfo {
  lastPeriodStart: string | null
  nextPeriodPrediction: string | null
  currentCycleDay: number | null
  isOnPeriod: boolean
  fertileWindowStart: string | null
  fertileWindowEnd: string | null
  ovulationDay: string | null
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getPeriodsKey = () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return `/api/periods?start=${oneYearAgo.toISOString().split('T')[0]}`
}

const SETTINGS_KEY = '/api/periods/settings'

export function usePeriods() {
  const [error, setError] = useState<string | null>(null)

  const { data: periodLogs = [], isLoading: logsLoading } = useSWR<PeriodLog[]>(
    getPeriodsKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const { data: settings = { average_cycle_length: 28, average_period_length: 5 }, isLoading: settingsLoading } = useSWR<CycleSettings>(
    SETTINGS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const loading = logsLoading || settingsLoading

  const logPeriod = async (data: {
    date: string
    flow_intensity?: 'spotting' | 'light' | 'medium' | 'heavy'
    symptoms?: string[]
    notes?: string
    is_period_day?: boolean
  }) => {
    const res = await fetch('/api/periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to log period')
    }
    
    const newLog = await res.json()
    const key = getPeriodsKey()
    mutate(key, (prev: PeriodLog[] = []) => {
      const filtered = prev.filter(p => p.date !== data.date)
      return [newLog, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
    }, false)
    return newLog
  }

  const deletePeriodLog = async (date: string) => {
    const res = await fetch(`/api/periods?date=${date}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete log')
    const key = getPeriodsKey()
    mutate(key, (prev: PeriodLog[] = []) => prev.filter(p => p.date !== date), false)
  }

  const updateSettings = async (newSettings: Partial<CycleSettings>) => {
    const res = await fetch('/api/periods/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, ...newSettings }),
    })
    if (!res.ok) throw new Error('Failed to update settings')
    const updated = await res.json()
    mutate(SETTINGS_KEY, updated, false)
    return updated
  }

  const cycleInfo = useMemo((): CycleInfo => {
    const periodDays = periodLogs
      .filter(p => p.is_period_day)
      .map(p => p.date)
      .sort((a, b) => b.localeCompare(a))

    if (periodDays.length === 0) {
      return {
        lastPeriodStart: null,
        nextPeriodPrediction: null,
        currentCycleDay: null,
        isOnPeriod: false,
        fertileWindowStart: null,
        fertileWindowEnd: null,
        ovulationDay: null,
      }
    }

    const periodStarts: string[] = []
    let currentStart = periodDays[0]
    periodStarts.push(currentStart)

    for (let i = 1; i < periodDays.length; i++) {
      const daysDiff = Math.abs(
        (new Date(currentStart).getTime() - new Date(periodDays[i]).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysDiff > 7) {
        currentStart = periodDays[i]
        periodStarts.push(currentStart)
      }
    }

    const lastPeriodStart = periodStarts[0]
    const today = new Date()
    const lastStartDate = new Date(lastPeriodStart)
    
    const daysSinceLastPeriod = Math.floor(
      (today.getTime() - lastStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const nextPeriodDate = new Date(lastStartDate)
    nextPeriodDate.setDate(nextPeriodDate.getDate() + settings.average_cycle_length)

    const ovulationDate = new Date(lastStartDate)
    ovulationDate.setDate(ovulationDate.getDate() + settings.average_cycle_length - 14)

    const fertileStart = new Date(ovulationDate)
    fertileStart.setDate(fertileStart.getDate() - 5)

    const fertileEnd = new Date(ovulationDate)
    fertileEnd.setDate(fertileEnd.getDate() + 1)

    const todayStr = today.toISOString().split('T')[0]
    const isOnPeriod = periodDays.includes(todayStr) || daysSinceLastPeriod < settings.average_period_length

    return {
      lastPeriodStart,
      nextPeriodPrediction: nextPeriodDate.toISOString().split('T')[0],
      currentCycleDay: daysSinceLastPeriod + 1,
      isOnPeriod,
      fertileWindowStart: fertileStart.toISOString().split('T')[0],
      fertileWindowEnd: fertileEnd.toISOString().split('T')[0],
      ovulationDay: ovulationDate.toISOString().split('T')[0],
    }
  }, [periodLogs, settings])

  const getPeriodLogForDate = (date: string): PeriodLog | undefined => {
    return periodLogs.find(p => p.date === date)
  }

  const recentCycles = useMemo(() => {
    const periodDays = periodLogs
      .filter(p => p.is_period_day)
      .map(p => p.date)
      .sort((a, b) => a.localeCompare(b))

    if (periodDays.length < 2) return []

    const cycles: { start: string; end: string; length: number }[] = []
    let cycleStart = periodDays[0]
    let lastDay = periodDays[0]

    for (let i = 1; i < periodDays.length; i++) {
      const daysDiff = Math.abs(
        (new Date(periodDays[i]).getTime() - new Date(lastDay).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysDiff > 7) {
        const cycleLength = Math.floor(
          (new Date(periodDays[i]).getTime() - new Date(cycleStart).getTime()) / (1000 * 60 * 60 * 24)
        )
        cycles.push({ start: cycleStart, end: lastDay, length: cycleLength })
        cycleStart = periodDays[i]
      }
      lastDay = periodDays[i]
    }

    return cycles.slice(-6).reverse()
  }, [periodLogs])

  return {
    periodLogs,
    settings,
    loading,
    error,
    logPeriod,
    deletePeriodLog,
    updateSettings,
    cycleInfo,
    getPeriodLogForDate,
    recentCycles,
    refetch: () => {
      mutate(getPeriodsKey())
      mutate(SETTINGS_KEY)
    },
  }
}
