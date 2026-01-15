'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHabits } from '@/hooks/use-habits'
import { useMoods } from '@/hooks/use-moods'
import { useHealth } from '@/hooks/use-health'
import { 
  MoodHeatmap, 
  HabitHeatmap, 
  CorrelationChart,
  SleepChart,
  StepsChart
} from '@/components/charts'
import { TrendingUp, Moon, Activity, Heart, Lightbulb } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'

export default function InsightsPage() {
  const { habits, completions, loading: habitsLoading } = useHabits()
  const { moods, loading: moodsLoading } = useMoods()
  const { healthData, garminStatus, loading: healthLoading } = useHealth()

  const loading = habitsLoading || moodsLoading || healthLoading

  const moodHeatmapData = useMemo(() => {
    return moods
      .filter(m => m.mood !== null)
      .map(m => ({ date: m.date, mood: m.mood as number }))
  }, [moods])

  const habitHeatmapData = useMemo(() => {
    const dateMap = new Map<string, { completed: number; total: number }>()
    
    completions.forEach(c => {
      const existing = dateMap.get(c.date) || { completed: 0, total: habits.length }
      existing.completed += 1
      dateMap.set(c.date, existing)
    })

    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { completed: 0, total: habits.length })
      }
    }

    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      completed: data.completed,
      total: data.total,
    }))
  }, [habits, completions])

  const sleepMoodCorrelation = useMemo(() => {
    const moodMap = new Map<string, number>()
    moods.forEach(m => {
      if (m.mood !== null) moodMap.set(m.date, m.mood)
    })

    return healthData
      .filter(h => h.sleep_duration_seconds && moodMap.has(h.date))
      .map(h => ({
        x: (h.sleep_duration_seconds || 0) / 3600,
        y: moodMap.get(h.date) || 0,
        date: new Date(h.date).toLocaleDateString('en-AU', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
      }))
  }, [healthData, moods])

  const stepsMoodCorrelation = useMemo(() => {
    const moodMap = new Map<string, number>()
    moods.forEach(m => {
      if (m.mood !== null) moodMap.set(m.date, m.mood)
    })

    return healthData
      .filter(h => h.steps && moodMap.has(h.date))
      .map(h => ({
        x: h.steps || 0,
        y: moodMap.get(h.date) || 0,
        date: new Date(h.date).toLocaleDateString('en-AU', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
      }))
  }, [healthData, moods])

  const sleepEnergyCorrelation = useMemo(() => {
    const energyMap = new Map<string, number>()
    moods.forEach(m => {
      if (m.energy !== null) energyMap.set(m.date, m.energy)
    })

    return healthData
      .filter(h => h.sleep_duration_seconds && energyMap.has(h.date))
      .map(h => ({
        x: (h.sleep_duration_seconds || 0) / 3600,
        y: energyMap.get(h.date) || 0,
        date: new Date(h.date).toLocaleDateString('en-AU', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
      }))
  }, [healthData, moods])

  const weeklyStats = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    const weekMoods = moods.filter(m => m.date >= weekAgoStr)
    const weekHealth = healthData.filter(h => h.date >= weekAgoStr)
    const weekCompletions = completions.filter(c => c.date >= weekAgoStr)

    const moodsWithValue = weekMoods.filter(m => m.mood !== null)
    const avgMood = moodsWithValue.length > 0 
      ? moodsWithValue.reduce((sum, m) => sum + (m.mood || 0), 0) / moodsWithValue.length 
      : null

    const avgSleep = weekHealth.filter(h => h.sleep_duration_seconds).length > 0
      ? weekHealth.reduce((sum, h) => sum + (h.sleep_duration_seconds || 0), 0) / 
        weekHealth.filter(h => h.sleep_duration_seconds).length / 3600
      : null

    const avgSteps = weekHealth.filter(h => h.steps).length > 0
      ? weekHealth.reduce((sum, h) => sum + (h.steps || 0), 0) / 
        weekHealth.filter(h => h.steps).length
      : null

    const habitCompletionRate = habits.length > 0 && weekCompletions.length > 0
      ? (weekCompletions.length / (habits.length * 7)) * 100
      : null

    return { avgMood, avgSleep, avgSteps, habitCompletionRate }
  }, [moods, healthData, habits, completions])

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Insights</h1>
          </div>
          <p className="text-muted-foreground text-lg">Discover patterns and correlations in your data.</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Mood</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.avgMood ? weeklyStats.avgMood.toFixed(1) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">past 7 days</p>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.avgSleep ? `${weeklyStats.avgSleep.toFixed(1)}h` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">past 7 days</p>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Steps</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.avgSteps ? Math.round(weeklyStats.avgSteps).toLocaleString() : '--'}
            </div>
            <p className="text-xs text-muted-foreground">past 7 days</p>
          </CardContent>
        </Card>
        <Card className="min-w-[140px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habit Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.habitCompletionRate ? `${Math.round(weeklyStats.habitCompletionRate)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">past 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="heatmaps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmaps" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mood Heatmap</CardTitle>
                <CardDescription>Your mood patterns throughout the year</CardDescription>
              </CardHeader>
              <CardContent>
                {moods.length > 0 ? (
                  <MoodHeatmap data={moodHeatmapData} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Start logging your mood to see patterns
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habit Completion Heatmap</CardTitle>
                <CardDescription>Your habit consistency throughout the year</CardDescription>
              </CardHeader>
              <CardContent>
                {habits.length > 0 ? (
                  <HabitHeatmap data={habitHeatmapData} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Create habits to track your consistency
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sleep vs Mood</CardTitle>
                <CardDescription>Does more sleep improve your mood?</CardDescription>
              </CardHeader>
              <CardContent>
                <CorrelationChart 
                  data={sleepMoodCorrelation}
                  xLabel="Sleep (hours)"
                  yLabel="Mood"
                  xFormatter={(v) => `${v.toFixed(1)}h`}
                  yFormatter={(v) => String(v)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sleep vs Energy</CardTitle>
                <CardDescription>Does more sleep boost your energy?</CardDescription>
              </CardHeader>
              <CardContent>
                <CorrelationChart 
                  data={sleepEnergyCorrelation}
                  xLabel="Sleep (hours)"
                  yLabel="Energy"
                  xFormatter={(v) => `${v.toFixed(1)}h`}
                  yFormatter={(v) => String(v)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steps vs Mood</CardTitle>
                <CardDescription>Does more activity improve your mood?</CardDescription>
              </CardHeader>
              <CardContent>
                <CorrelationChart 
                  data={stepsMoodCorrelation}
                  xLabel="Steps"
                  yLabel="Mood"
                  xFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  yFormatter={(v) => String(v)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {garminStatus.connected ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sleep Trends</CardTitle>
                  <CardDescription>Your sleep duration over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <SleepChart data={healthData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Steps Trends</CardTitle>
                  <CardDescription>Your daily steps over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <StepsChart data={healthData} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="mb-2">Connect Garmin to see health trends</p>
                  <a href="/settings" className="text-primary hover:underline">
                    Go to Settings →
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
