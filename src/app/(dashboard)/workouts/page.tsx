'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkoutForm } from '@/components/forms/workout-form'
import { useAllWorkouts, UnifiedWorkout } from '@/hooks/use-all-workouts'
import { LayoutDashboard, List, Search, RefreshCw, Loader2, Clock, Flame, Heart, Footprints, Trash2, Watch, PenLine, MapPin, Upload, ChevronLeft, ChevronRight, X, Activity, CalendarIcon, Dumbbell, Zap, Trophy, ArrowUpRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, isFuture } from 'date-fns'
import { useShareView } from '@/lib/share-view/context'

const WORKOUT_ICONS: Record<string, string> = {
  running: '🏃',
  street_running: '🏃',
  treadmill: '🏃‍♂️',
  treadmill_running: '🏃‍♂️',
  indoor_running: '🏃‍♂️',
  cycling: '🚴',
  indoor_cycling: '🚴',
  swimming: '🏊',
  weights: '🏋️',
  strength_training: '🏋️',
  yoga: '🧘',
  'hot-yoga': '🔥',
  pilates: '🤸‍♀️',
  reformer: '🤸‍♀️',
  hiit: '💪',
  walking: '🚶',
  cardio: '💓',
  indoor_cardio: '💓',
  fitness_equipment: '🏋️',
  other: '🎯',
}

const INTENSITY_COLORS: Record<string, string> = {
  light: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  intense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const getWorkoutIcon = (type: string, name: string = '') => {
  const t = type?.toLowerCase() || ''
  const n = name?.toLowerCase() || ''
  const combined = `${t} ${n}`
  
  if (combined.includes('treadmill')) return '🏃‍♂️'
  if (combined.includes('reformer')) return '🤸‍♀️'
  if (combined.includes('hot yoga') || combined.includes('bikram')) return '🔥'
  if (combined.includes('pilates')) return '🤸‍♀️'
  
  return WORKOUT_ICONS[t] || WORKOUT_ICONS[t.replace(/_/g, '')] || '🎯'
}

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '--'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

const formatDistance = (meters: number | null) => {
  if (!meters) return null
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: List },
] as const

export default function WorkoutsPage() {
  const { workouts, loading, loadingMore, syncing, error, hasMore, loadMore, syncGarmin, createWorkout, updateWorkout, deleteWorkout, deleteActivity, refetch } = useAllWorkouts()
  const { isShareView } = useShareView()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(20)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/activities/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      toast.success(`Imported ${data.imported} activities (${data.skipped} skipped)`)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  
  const calendarRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount(20)
  }, [activeTab, searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isMobile = window.innerWidth < 1024
      if (isMobile) return
      
      if (
        selectedDate &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        (!detailsRef.current || !detailsRef.current.contains(event.target as Node))
      ) {
        setSelectedDate(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedDate])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const getWorkoutsForDay = (day: Date) => {
    return workouts.filter(w => {
      const wDate = w.startTime ? parseISO(w.startTime) : new Date(w.date)
      return isSameDay(wDate, day)
    })
  }

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1))
  const handleDayClick = (day: Date) => {
    if (selectedDate && isSameDay(selectedDate, day)) {
      setSelectedDate(null)
    } else {
      setSelectedDate(day)
    }
  }

  const selectedDateWorkouts = selectedDate ? getWorkoutsForDay(selectedDate) : []

  const dayStats = {
    duration: selectedDateWorkouts.reduce((acc, w) => acc + (w.durationMinutes || 0), 0),
    calories: selectedDateWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0),
    avgHr: Math.round(
      selectedDateWorkouts.filter(w => w.avgHeartRate).reduce((acc, w) => acc + (w.avgHeartRate || 0), 0) / 
      (selectedDateWorkouts.filter(w => w.avgHeartRate).length || 1)
    )
  }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeekWorkouts = workouts.filter(w => {
    const date = w.startTime ? parseISO(w.startTime) : new Date(w.date)
    return isWithinInterval(date, { start: weekStart, end: weekEnd })
  })

  const totalMinutes = thisWeekWorkouts.reduce((acc, w) => acc + (w.durationMinutes || 0), 0)
  const totalCalories = thisWeekWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0)
  const garminCount = thisWeekWorkouts.filter(w => w.source === 'garmin').length
  const manualCount = thisWeekWorkouts.filter(w => w.source === 'manual').length

  const handleSync = async () => {
    try {
      await syncGarmin()
    } catch {
    }
  }

  const handleDelete = async (workout: UnifiedWorkout) => {
    try {
      if (workout.source === 'manual') {
        await deleteWorkout(workout.id)
      } else if (workout.source === 'garmin') {
        await deleteActivity(workout.id)
      }
      toast.success('Workout deleted')
    } catch (err) {
      toast.error('Failed to delete workout')
    }
  }

  const filteredWorkouts = workouts.filter(workout => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      workout.name.toLowerCase().includes(query) ||
      workout.type.toLowerCase().includes(query) ||
      (workout.notes && workout.notes.toLowerCase().includes(query))
    )
  })

  const visibleWorkouts = filteredWorkouts.slice(0, visibleCount)
  const hasMoreLocal = filteredWorkouts.length > visibleCount

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
                <Dumbbell className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Workouts
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                Your activity history and stats
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative lg:hidden">
            <Button variant="outline" size="sm" className="gap-2 border-border/60 hover:bg-accent/50">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {selectedDate ? (isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')) : 'Select Date'}
            </Button>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>

          {!isShareView && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importing} className="gap-2 border-border/60 hover:bg-accent/50">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                {importing ? 'Importing...' : 'Import'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2 border-border/60 hover:bg-accent/50">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-muted-foreground" />}
                {syncing ? 'Syncing...' : 'Sync'}
              </Button>
              <WorkoutForm onSubmit={createWorkout} />
            </>
          )}
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

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <X className="h-4 w-4 text-destructive" />
                  </div>
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { 
                  title: "This Week", 
                  value: thisWeekWorkouts.length, 
                  sub: `${garminCount} synced, ${manualCount} manual`,
                  icon: CalendarIcon,
                },
                { 
                  title: "Duration", 
                  value: formatDuration(totalMinutes), 
                  sub: "total this week",
                  icon: Clock,
                },
                { 
                  title: "Calories", 
                  value: totalCalories > 0 ? totalCalories.toLocaleString() : '--', 
                  sub: "burned this week",
                  icon: Flame,
                },
                { 
                  title: "All Time", 
                  value: workouts.length, 
                  sub: "total workouts",
                  icon: Trophy,
                }
              ].map((stat, i) => (
                <Card key={i} className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
                  <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                    <stat.icon className="w-32 h-32" />
                  </div>
                  <CardHeader className="pb-2 relative">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
                      {stat.sub}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
              <div className="hidden lg:block h-full">
                <Card className="overflow-hidden border-border/50 h-full flex flex-col" ref={calendarRef}>
                  <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-base font-semibold tracking-tight">
                      {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {weekDays.map(day => <div key={day} className="py-1">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
                      {calendarDays.map((day) => {
                        const dayWorkouts = getWorkoutsForDay(day)
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const isSelected = selectedDate && isSameDay(day, selectedDate)
                        const isTodayDate = isToday(day)
                        const isFutureDate = isFuture(day)
                        
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => !isFutureDate && handleDayClick(day)}
                            disabled={isFutureDate}
                            className={`
                              relative flex flex-col items-center justify-start py-1 min-h-[52px] rounded-xl border transition-all duration-300 group
                              ${isCurrentMonth ? 'bg-card' : 'bg-muted/10 text-muted-foreground/30'}
                              ${isSelected ? 'ring-2 ring-primary border-primary shadow-md z-10 bg-primary/5' : 'border-border/40 hover:border-primary/30'}
                              ${isTodayDate ? 'bg-accent/40 font-semibold border-accent' : ''}
                              ${isFutureDate ? 'opacity-30 pointer-events-none' : 'cursor-pointer hover:bg-accent/20'}
                            `}
                          >
                            <span className={`
                              text-[10px] mb-0.5 w-6 h-6 flex items-center justify-center rounded-full transition-colors
                              ${isTodayDate ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                              ${isSelected && !isTodayDate ? 'text-primary font-bold' : ''}
                            `}>
                              {format(day, 'd')}
                            </span>
                            <div className="flex flex-wrap items-center justify-center gap-0.5 px-0.5 w-full mt-auto mb-0.5">
                              {dayWorkouts.slice(0, 3).map((w, idx) => (
                                <span key={`${day.toISOString()}-${idx}`} className="text-[9px] transform transition-transform group-hover:scale-110" title={w.name}>
                                  {getWorkoutIcon(w.type, w.name)}
                                </span>
                              ))}
                              {dayWorkouts.length > 3 && (
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-full min-w-0">
                {selectedDate ? (
                  <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in duration-300 slide-in-from-right-4 h-full flex flex-col" ref={detailsRef}>
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base font-semibold">
                          {format(selectedDate, 'MMMM d, yyyy')}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10" onClick={() => setSelectedDate(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col gap-4">
                      {selectedDateWorkouts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                            <Zap className="h-8 w-8 opacity-20" />
                          </div>
                          <p className="font-medium">No workouts recorded</p>
                          <p className="text-sm opacity-70 mb-4">Take a rest day or log an activity</p>
                          {!isShareView && (
                            <WorkoutForm
                              onSubmit={createWorkout}
                              trigger={
                                <Button variant="outline" size="sm" className="gap-2">
                                  <PenLine className="h-3.5 w-3.5" /> Log Workout
                                </Button>
                              }
                            />
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'Workouts', value: selectedDateWorkouts.length, icon: Activity },
                              { label: 'Duration', value: formatDuration(dayStats.duration), icon: Clock },
                              { label: 'Calories', value: dayStats.calories > 0 ? dayStats.calories.toLocaleString() : '--', icon: Flame },
                              { label: 'Avg HR', value: dayStats.avgHr > 0 ? `${dayStats.avgHr} bpm` : '--', icon: Heart }
                            ].map((stat, i) => (
                              <div key={i} className="flex flex-col gap-1 p-3 bg-card/60 rounded-xl border border-border/40 shadow-sm backdrop-blur-sm">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                                  <stat.icon className="w-3 h-3" /> {stat.label}
                                </span>
                                <span className="text-lg font-bold">{stat.value}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[200px]">
                            {selectedDateWorkouts.map((workout) => (
                              <div
                                key={`${workout.source}-${workout.id}`}
                                className="relative flex items-start justify-between p-4 rounded-xl bg-card border border-border/50 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all duration-300"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="text-3xl p-2 bg-muted/20 rounded-2xl group-hover:bg-primary/10 transition-colors">
                                    {getWorkoutIcon(workout.type, workout.name)}
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-sm">{workout.name}</h4>
                                      {workout.source === 'garmin' ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                          <Watch className="h-2.5 w-2.5" />
                                          Garmin
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                          <PenLine className="h-2.5 w-2.5" />
                                          Manual
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground font-medium">
                                      {workout.durationMinutes && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDuration(workout.durationMinutes)}
                                        </span>
                                      )}
                                      {workout.calories && (
                                        <span className="flex items-center gap-1">
                                          <Flame className="h-3 w-3" />
                                          {workout.calories}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {!isShareView && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute top-3 right-3 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-1 shadow-sm">
                                     {workout.source === 'manual' && (
                                      <WorkoutForm
                                        initialData={{
                                          date: workout.date,
                                          workout_type: workout.type,
                                          duration_minutes: workout.durationMinutes || undefined,
                                          calories: workout.calories || undefined,
                                          intensity: workout.intensity as any,
                                          notes: workout.notes || undefined
                                        }}
                                        onSubmit={(data) => updateWorkout(workout.id, data)}
                                        trigger={
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                                            <PenLine className="h-3.5 w-3.5" />
                                          </Button>
                                        }
                                      />
                                     )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDelete(workout)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-border/60 rounded-xl text-muted-foreground bg-muted/5 p-8 relative overflow-hidden">
                     <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
                     <div className="relative flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                        <CalendarIcon className="w-10 h-10 opacity-30" />
                      </div>
                      <p className="font-semibold text-xl text-foreground">Select a day</p>
                      <p className="text-sm mt-2 opacity-60 max-w-xs text-center">
                        Click on any date in the calendar to view details or add new workouts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  All Workouts
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workouts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {visibleWorkouts.length === 0 ? (
                  <div className="text-center py-16 bg-muted/5">
                    <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                      {searchQuery ? <Search className="w-12 h-12 opacity-20" /> : <Dumbbell className="w-12 h-12 opacity-20" />}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{searchQuery ? 'No matching workouts' : 'No workouts recorded yet'}</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      {searchQuery ? 'Try a different search term' : (isShareView ? 'No workouts have been recorded' : 'Get started by syncing from your device or manually logging your first activity.')}
                    </p>
                    {!isShareView && !searchQuery && (
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-2">
                          <RefreshCw className="h-4 w-4" /> Sync Garmin
                        </Button>
                        <WorkoutForm
                          onSubmit={createWorkout}
                          trigger={<Button className="gap-2"><PenLine className="h-4 w-4" /> Log Manually</Button>}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {visibleWorkouts.map((workout) => (
                      <div
                        key={`${workout.source}-${workout.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-2xl sm:text-3xl p-3 bg-secondary/30 rounded-2xl group-hover:bg-primary/10 transition-colors">
                            {getWorkoutIcon(workout.type, workout.name)}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-base">{workout.name}</h4>
                              {workout.source === 'garmin' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  <Watch className="h-2.5 w-2.5" />
                                  Garmin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  <PenLine className="h-2.5 w-2.5" />
                                  Manual
                                </span>
                              )}
                              {workout.intensity && (
                                 <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${INTENSITY_COLORS[workout.intensity]}`}>
                                   {workout.intensity}
                                 </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {workout.startTime 
                                  ? format(parseISO(workout.startTime), 'EEE, MMM d · h:mm a')
                                  : format(new Date(workout.date), 'EEE, MMM d')
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-x-4 gap-y-1 text-sm text-muted-foreground flex-wrap pt-0.5">
                              {workout.durationMinutes && (
                                <span className="flex items-center gap-1.5" title="Duration">
                                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                                  {formatDuration(workout.durationMinutes)}
                                </span>
                              )}
                              {formatDistance(workout.distanceMeters) && (
                                <span className="flex items-center gap-1.5" title="Distance">
                                  <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                  {formatDistance(workout.distanceMeters)}
                                </span>
                              )}
                              {workout.calories && (
                                <span className="flex items-center gap-1.5" title="Calories">
                                  <Flame className="h-3.5 w-3.5 text-primary/70" />
                                  {workout.calories} cal
                                </span>
                              )}
                              {workout.avgHeartRate && (
                                <span className="flex items-center gap-1.5" title="Avg Heart Rate">
                                  <Heart className="h-3.5 w-3.5 text-primary/70" />
                                  {workout.avgHeartRate} bpm
                                </span>
                              )}
                            </div>
                            
                            {workout.notes && (
                              <p className="text-sm text-muted-foreground italic mt-1 line-clamp-1 opacity-80">
                                {workout.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {!isShareView && workout.source === 'manual' && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0 sm:ml-4 self-end sm:self-center">
                            <WorkoutForm
                              initialData={{
                                date: workout.date,
                                workout_type: workout.type,
                                duration_minutes: workout.durationMinutes || undefined,
                                calories: workout.calories || undefined,
                                intensity: workout.intensity as any,
                                notes: workout.notes || undefined
                              }}
                              onSubmit={(data) => updateWorkout(workout.id, data)}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                >
                                  <PenLine className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(workout)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {!isShareView && workout.source === 'garmin' && (
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0 sm:ml-4 self-end sm:self-center">
                             <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(workout)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                           </div>
                        )}
                      </div>
                    ))}
                    
                    {(hasMore || hasMoreLocal) && (
                      <div className="p-6 flex justify-center border-t border-border/40">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (hasMoreLocal) {
                              setVisibleCount(prev => prev + 20)
                            } else {
                              loadMore()
                            }
                          }}
                          disabled={loadingMore}
                          className="gap-2 min-w-[200px] cursor-pointer"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
