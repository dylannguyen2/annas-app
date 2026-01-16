'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Footprints, Heart, RefreshCw, Loader2, AlertCircle, Flame, Activity } from 'lucide-react'
import { useHealth } from '@/hooks/use-health'
import { useShareView } from '@/lib/share-view/context'
import { SleepChart, StepsChart, HeartRateChart } from '@/components/charts'
import { HealthSkeleton } from '@/components/dashboard/health-skeleton'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'activity', label: 'Activity', icon: Footprints },
  { id: 'heart', label: 'Heart', icon: Heart },
] as const

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<'sleep' | 'activity' | 'heart'>('sleep')
  const { isShareView } = useShareView()
  const {
    healthData,
    garminStatus,
    loading,
    syncing,
    error,
    syncGarmin,
    getTodayHealth,
    formatSleepDuration
  } = useHealth()

  const todayHealth = getTodayHealth
  const latestHealth = healthData[0]

  const handleSync = async () => {
    try {
      await syncGarmin()
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  const formatDistance = (meters: number | null) => {
    if (!meters) return '--'
    const km = meters / 1000
    return `${km.toFixed(1)} km`
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '--'
    return num.toLocaleString()
  }

  if (loading) {
    return <HealthSkeleton />
  }

  if (!garminStatus.connected) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                  Health
                </h1>
                <p className="text-muted-foreground font-medium mt-1">
                  Your Garmin health data
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">💓</div>
            <h3 className="text-xl font-semibold mb-2">Garmin Not Connected</h3>
            <p className="text-muted-foreground mb-6">
              Connect your Garmin account to see your health data
            </p>
            {!isShareView && (
              <Button asChild>
                <Link href="/settings">Connect Garmin</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayHealth = todayHealth || latestHealth

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                <Heart className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Health
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                {garminStatus.lastSync 
                  ? `Last synced: ${new Date(garminStatus.lastSync).toLocaleString()}`
                  : 'Your Garmin health data'
                }
              </p>
            </div>
          </div>
        </div>
        {!isShareView && (
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2 border-border/60 hover:bg-accent/50">
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            )}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-hidden whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'sleep' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { title: "Duration", value: formatSleepDuration(displayHealth?.sleep_duration_seconds ?? null), sub: "total sleep time", icon: Moon },
              { title: "Deep Sleep", value: formatSleepDuration(displayHealth?.deep_sleep_seconds ?? null), sub: "restorative sleep", icon: Moon },
              { title: "Light Sleep", value: formatSleepDuration(displayHealth?.light_sleep_seconds ?? null), sub: "transitional sleep", icon: Moon },
              { title: "REM Sleep", value: formatSleepDuration(displayHealth?.rem_sleep_seconds ?? null), sub: "dream sleep", icon: Moon },
            ].map((stat, i) => (
              <Card key={i} className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <stat.icon className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Sleep Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <SleepChart data={healthData} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 grid-cols-3">
            {[
              { title: "Steps", value: formatNumber(displayHealth?.steps ?? null), sub: "today's steps", icon: Footprints },
              { title: "Distance", value: formatDistance(displayHealth?.distance_meters ?? null), sub: "total distance", icon: Activity },
              { title: "Calories", value: formatNumber(displayHealth?.total_calories ?? null), sub: "burned today", icon: Flame },
            ].map((stat, i) => (
              <Card key={i} className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <stat.icon className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <StepsChart data={healthData} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'heart' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { title: "Resting HR", value: displayHealth?.resting_heart_rate ? `${displayHealth.resting_heart_rate} bpm` : '--', sub: "at rest", icon: Heart },
              { title: "Average HR", value: displayHealth?.avg_heart_rate ? `${displayHealth.avg_heart_rate} bpm` : '--', sub: "daily average", icon: Heart },
              { title: "Min HR", value: displayHealth?.min_heart_rate ? `${displayHealth.min_heart_rate} bpm` : '--', sub: "lowest today", icon: Heart },
              { title: "Max HR", value: displayHealth?.max_heart_rate ? `${displayHealth.max_heart_rate} bpm` : '--', sub: "peak today", icon: Heart },
            ].map((stat, i) => (
              <Card key={i} className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <stat.icon className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Heart Rate Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <HeartRateChart data={healthData} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
