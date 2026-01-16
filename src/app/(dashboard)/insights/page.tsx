'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { TrendingUp, Moon, Activity, Heart, Lightbulb, Grid3X3, GitCompare } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'heatmaps', label: 'Heatmaps', icon: Grid3X3 },
  { id: 'correlations', label: 'Correlations', icon: GitCompare },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
] as const

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'heatmaps' | 'correlations' | 'trends'>('heatmaps')
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                <Lightbulb className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Insights
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                Discover patterns and correlations in your data
              </p>
            </div>
          </div>
        </div>
      </div>

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

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <TrendingUp className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Mood</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {weeklyStats.avgMood ? weeklyStats.avgMood.toFixed(1) : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">past 7 days</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <Moon className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Sleep</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {weeklyStats.avgSleep ? `${weeklyStats.avgSleep.toFixed(1)}h` : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">past 7 days</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <Activity className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Steps</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {weeklyStats.avgSteps ? Math.round(weeklyStats.avgSteps).toLocaleString() : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">past 7 days</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <Heart className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Habit Rate</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {weeklyStats.habitCompletionRate ? `${Math.round(weeklyStats.habitCompletionRate)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">past 7 days</p>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'heatmaps' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Mood Heatmap</CardTitle>
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

            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Habit Completion Heatmap</CardTitle>
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
        </div>
      )}

      {activeTab === 'correlations' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sleep vs Mood</CardTitle>
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

            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sleep vs Energy</CardTitle>
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

            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Steps vs Mood</CardTitle>
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
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {garminStatus.connected ? (
            <>
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Sleep Trends</CardTitle>
                  <CardDescription>Your sleep duration over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <SleepChart data={healthData} />
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Steps Trends</CardTitle>
                  <CardDescription>Your daily steps over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <StepsChart data={healthData} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
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
        </div>
      )}
    </div>
  )
}
