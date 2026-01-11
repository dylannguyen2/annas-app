'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkoutForm } from '@/components/forms/workout-form'
import { useAllWorkouts, UnifiedWorkout } from '@/hooks/use-all-workouts'
import { RefreshCw, Loader2, Clock, Flame, Heart, Footprints, Trash2, Watch, PenLine, MapPin, Upload, ChevronLeft, ChevronRight, X, Activity, CalendarIcon } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, isFuture } from 'date-fns'

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

export default function WorkoutsPage() {
  const { workouts, loading, syncing, error, syncGarmin, createWorkout, updateWorkout, deleteWorkout, refetch } = useAllWorkouts()
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
    function handleClickOutside(event: MouseEvent) {
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
        const res = await fetch(`/api/garmin/activities/${workout.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete activity')
        refetch()
      }
      toast.success('Workout deleted')
    } catch (err) {
      toast.error('Failed to delete workout')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workouts</h2>
          <p className="text-muted-foreground">
            Synced from Garmin and manual entries
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative lg:hidden">
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importing}>
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {importing ? 'Importing...' : 'Import'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
          <WorkoutForm onSubmit={createWorkout} />
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekWorkouts.length}</div>
            <p className="text-xs text-muted-foreground">
              {garminCount} synced, {manualCount} manual
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
            <p className="text-xs text-muted-foreground">total this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalories > 0 ? totalCalories.toLocaleString() : '--'}</div>
            <p className="text-xs text-muted-foreground">burned this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm font-medium">All Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length}</div>
            <p className="text-xs text-muted-foreground">total workouts</p>
          </CardContent>
        </Card>
      </div>

      
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="hidden lg:block w-full lg:w-[400px] shrink-0">
          <Card className="overflow-hidden" ref={calendarRef}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                {weekDays.map(day => <div key={day} className="py-1">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
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
                        relative flex flex-col items-center justify-start py-0.5 min-h-[44px] md:min-h-[56px] rounded-md border transition-all
                        ${isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground/50'}
                        ${isSelected ? 'ring-2 ring-primary border-primary z-10' : 'border-border/50'}
                        ${isTodayDate ? 'bg-accent/50 font-semibold' : ''}
                        ${isFutureDate ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-accent hover:border-accent'}
                      `}
                    >
                      <span className={`
                        text-[10px] mb-0.5 w-5 h-5 flex items-center justify-center rounded-full transition-colors
                        ${isTodayDate ? 'bg-primary text-primary-foreground' : ''}
                        ${isSelected && !isTodayDate ? 'text-primary font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-px px-0.5 w-full">
                        {dayWorkouts.slice(0, 4).map((w, idx) => (
                          <span key={`${day.toISOString()}-${idx}`} className="text-[10px]" title={w.name}>
                            {getWorkoutIcon(w.type, w.name)}
                          </span>
                        ))}
                        {dayWorkouts.length > 4 && (
                          <span className="text-[8px] leading-none text-muted-foreground">+</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 w-full min-w-0">
          {selectedDate ? (
            <Card className="border-primary/20 bg-primary/5 animate-in fade-in duration-300 h-full" ref={detailsRef}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">
                  Workouts on {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSelectedDate(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {selectedDateWorkouts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No workouts recorded on this day.</p>
                    <div className="mt-4">
                      <WorkoutForm 
                        onSubmit={createWorkout} 
                        trigger={<Button variant="outline" size="sm">Log</Button>}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Workouts
                        </span>
                        <span className="text-xl font-bold">{selectedDateWorkouts.length}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Duration
                        </span>
                        <span className="text-xl font-bold">{formatDuration(dayStats.duration)}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                          <Flame className="w-3 h-3" /> Calories
                        </span>
                        <span className="text-xl font-bold">{dayStats.calories > 0 ? dayStats.calories.toLocaleString() : '--'}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                          <Heart className="w-3 h-3" /> Avg HR
                        </span>
                        <span className="text-xl font-bold">
                          {dayStats.avgHr > 0 ? `${dayStats.avgHr} bpm` : '--'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedDateWorkouts.map((workout) => (
                      <div
                        key={`${workout.source}-${workout.id}`}
                        className="flex items-start justify-between p-3 rounded-lg bg-background border shadow-sm group hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl mt-1">
                            {getWorkoutIcon(workout.type, workout.name)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm leading-none">{workout.name}</h4>
                              {workout.source === 'garmin' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  <Watch className="h-2.5 w-2.5" />
                                  Garmin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                  <PenLine className="h-2.5 w-2.5" />
                                  Manual
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
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
                        {workout.source === 'manual' ? (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
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
                                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                                >
                                  <PenLine className="h-3 w-3" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(workout)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(workout)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-xl text-muted-foreground bg-muted/5 p-8">
              <div className="text-4xl mb-4 opacity-50">📅</div>
              <p className="font-medium text-lg">Select a day to see details</p>
              <p className="text-sm mt-1 opacity-70">Click on any date in the calendar to view or add workouts</p>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">
                Sync from Garmin or log workouts manually
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync
                </Button>
                <WorkoutForm
                  onSubmit={createWorkout}
                  trigger={<Button>Log</Button>}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {workouts.slice(0, 30).map((workout) => (
                <div
                  key={`${workout.source}-${workout.id}`}
                  className="flex items-start justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {getWorkoutIcon(workout.type, workout.name)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{workout.name}</h4>
                        {workout.source === 'garmin' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Watch className="h-2.5 w-2.5" />
                            Garmin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <PenLine className="h-2.5 w-2.5" />
                            Manual
                          </span>
                        )}
                        {workout.intensity && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${INTENSITY_COLORS[workout.intensity]}`}>
                            {workout.intensity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workout.startTime 
                          ? format(parseISO(workout.startTime), 'EEE, MMM d · h:mm a')
                          : format(new Date(workout.date), 'EEE, MMM d')
                        }
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {workout.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(workout.durationMinutes)}
                          </span>
                        )}
                        {formatDistance(workout.distanceMeters) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {formatDistance(workout.distanceMeters)}
                          </span>
                        )}
                        {workout.calories && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5" />
                            {workout.calories} cal
                          </span>
                        )}
                        {workout.avgHeartRate && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {workout.avgHeartRate} bpm
                          </span>
                        )}
                        {workout.steps && workout.steps > 0 && (
                          <span className="flex items-center gap-1">
                            <Footprints className="h-3.5 w-3.5" />
                            {workout.steps.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          {workout.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {workout.source === 'manual' && (
                    <div className="flex items-center gap-1">
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
                            className="text-muted-foreground hover:text-primary"
                          >
                            <PenLine className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(workout)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
