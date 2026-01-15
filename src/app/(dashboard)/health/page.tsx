'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Moon, Footprints, Heart, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { useHealth } from '@/hooks/use-health'
import { useShareView } from '@/lib/share-view/context'
import { SleepChart, StepsChart, HeartRateChart } from '@/components/charts'
import { HealthSkeleton } from '@/components/dashboard/health-skeleton'
import Link from 'next/link'

export default function HealthPage() {
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Health</h1>
            </div>
            <p className="text-muted-foreground text-lg">Your Garmin health data.</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Garmin Not Connected</h3>
              <p className="text-muted-foreground mt-1">
                Connect your Garmin account to see your health data
              </p>
            </div>
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Health</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {garminStatus.lastSync 
              ? `Last synced: ${new Date(garminStatus.lastSync).toLocaleString()}`
              : 'Your Garmin health data.'
            }
          </p>
        </div>
        {!isShareView && (
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
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

      <Tabs defaultValue="sleep" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sleep" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Sleep
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Footprints className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="heart" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Heart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sleep" className="space-y-4">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSleepDuration(displayHealth?.sleep_duration_seconds ?? null)}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Deep Sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSleepDuration(displayHealth?.deep_sleep_seconds ?? null)}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Light Sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSleepDuration(displayHealth?.light_sleep_seconds ?? null)}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">REM Sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSleepDuration(displayHealth?.rem_sleep_seconds ?? null)}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Sleep Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <SleepChart data={healthData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(displayHealth?.steps ?? null)}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDistance(displayHealth?.distance_meters ?? null)}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(displayHealth?.total_calories ?? null)}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <StepsChart data={healthData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heart" className="space-y-4">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Resting HR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayHealth?.resting_heart_rate ? `${displayHealth.resting_heart_rate} bpm` : '--'}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Average HR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayHealth?.avg_heart_rate ? `${displayHealth.avg_heart_rate} bpm` : '--'}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Min HR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayHealth?.min_heart_rate ? `${displayHealth.min_heart_rate} bpm` : '--'}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium">Max HR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayHealth?.max_heart_rate ? `${displayHealth.max_heart_rate} bpm` : '--'}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Heart Rate Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <HeartRateChart data={healthData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
