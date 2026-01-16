'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { usePeriods } from '@/hooks/use-periods'
import { useShareView } from '@/lib/share-view/context'
import { Loader2, Droplet, Calendar as CalendarIcon, Heart, Sparkles, Trash2, Activity, ThermometerSun, AlertCircle, List } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'track', label: 'Track', icon: CalendarIcon },
  { id: 'history', label: 'History', icon: List },
] as const

const FLOW_OPTIONS = [
  { value: 'spotting', label: 'Spotting', color: 'bg-pink-200 hover:bg-pink-300 text-pink-700' },
  { value: 'light', label: 'Light', color: 'bg-pink-300 hover:bg-pink-400 text-pink-800' },
  { value: 'medium', label: 'Medium', color: 'bg-pink-400 hover:bg-pink-500 text-white' },
  { value: 'heavy', label: 'Heavy', color: 'bg-pink-500 hover:bg-pink-600 text-white' },
] as const

const SYMPTOM_OPTIONS = [
  'Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood swings',
  'Back pain', 'Breast tenderness', 'Acne', 'Cravings', 'Nausea'
]

export default function CyclePage() {
  const { isShareView } = useShareView()
  const {
    periodLogs,
    settings,
    loading,
    logPeriod,
    deletePeriodLog,
    cycleInfo,
    getPeriodLogForDate,
    recentCycles
  } = usePeriods()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<'spotting' | 'light' | 'medium' | 'heavy' | null>(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('track')

  const selectedDateStr = selectedDate ? formatDate(selectedDate) : ''
  const existingLog = getPeriodLogForDate(selectedDateStr)

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const dateStr = formatDate(date)
      const log = getPeriodLogForDate(dateStr)
      if (log) {
        setSelectedFlow(log.flow_intensity)
        setSelectedSymptoms(log.symptoms || [])
        setNotes(log.notes || '')
      } else {
        setSelectedFlow(null)
        setSelectedSymptoms([])
        setNotes('')
      }
    }
  }

  const handleSave = async () => {
    if (!selectedDate) return
    setSaving(true)
    try {
      await logPeriod({
        date: selectedDateStr,
        flow_intensity: selectedFlow || undefined,
        symptoms: selectedSymptoms,
        notes: notes || undefined,
        is_period_day: selectedFlow !== null,
      })
      setDialogOpen(false)
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDate) return
    setSaving(true)
    try {
      await deletePeriodLog(selectedDateStr)
      setSelectedFlow(null)
      setSelectedSymptoms([])
      setNotes('')
      setDialogOpen(false)
    } catch (err) {
      console.error('Error deleting:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const periodDates = periodLogs
    .filter(p => p.is_period_day)
    .map(p => new Date(p.date + 'T00:00:00'))

  const predictedDates: Date[] = []
  if (cycleInfo.nextPeriodPrediction) {
    const nextStart = new Date(cycleInfo.nextPeriodPrediction)
    for (let i = 0; i < settings.average_period_length; i++) {
      const d = new Date(nextStart)
      d.setDate(d.getDate() + i)
      predictedDates.push(d)
    }
  }

  const fertileDates: Date[] = []
  if (cycleInfo.fertileWindowStart && cycleInfo.fertileWindowEnd) {
    let current = new Date(cycleInfo.fertileWindowStart)
    const end = new Date(cycleInfo.fertileWindowEnd)
    while (current <= end) {
      fertileDates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
  }

  const modifiers = {
    period: periodDates,
    predicted: predictedDates,
    fertile: fertileDates,
    ovulation: cycleInfo.ovulationDay ? [new Date(cycleInfo.ovulationDay)] : [],
  }

  const modifiersClassNames = {
    period: 'period-day',
    predicted: 'predicted-day',
    fertile: 'fertile-day',
    ovulation: 'ovulation-day',
  }

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
                <Droplet className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Cycle Tracker
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                Track your period and predict your cycle
              </p>
            </div>
          </div>
        </div>
        
        {!isShareView && activeTab === 'track' && (
          <Button 
            onClick={() => setDialogOpen(true)} 
            disabled={!selectedDate}
            size="sm"
            className="gap-2"
          >
            {existingLog ? 'Edit Log' : 'Log Period'}
          </Button>
        )}
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

      {activeTab === 'track' && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <CalendarIcon className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Cycle</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">
                {cycleInfo.currentCycleDay ? `${cycleInfo.currentCycleDay}` : '--'}
              </span>
              <span className="text-sm text-muted-foreground font-medium">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80 flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", cycleInfo.isOnPeriod ? "bg-primary animate-pulse" : "bg-muted")}></span>
              {cycleInfo.isOnPeriod ? 'Currently on period' : 'Follicular phase'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <Droplet className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Period</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground truncate">
              {cycleInfo.nextPeriodPrediction 
                ? new Date(cycleInfo.nextPeriodPrediction).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
              {cycleInfo.nextPeriodPrediction ? (
                <span className="text-primary">
                  {Math.ceil((new Date(cycleInfo.nextPeriodPrediction).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                </span>
              ) : 'Prediction unavailable'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <Heart className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fertile Window</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground truncate">
              {cycleInfo.fertileWindowStart 
                ? `${new Date(cycleInfo.fertileWindowStart).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
              {cycleInfo.ovulationDay ? (
                 <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ThermometerSun className="w-3 h-3" />
                    Ovulation: {new Date(cycleInfo.ovulationDay).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                 </span>
              ) : (
                'Not calculated'
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{settings.average_cycle_length}</span>
              <span className="text-sm text-muted-foreground font-medium">day cycle</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
              Avg. Period: <span className="text-foreground">{settings.average_period_length} days</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_3fr] items-start">
        <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
            <div className="space-y-3">
              <div>
                <CardTitle className="text-xl">Calendar View</CardTitle>
                <CardDescription>Select a date to log details</CardDescription>
              </div>
              <div className="hidden sm:flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5 py-1 px-2 font-normal border-primary/20 bg-primary/5">
                  <div className="w-2 h-2 rounded-full bg-primary" /> Period
                </Badge>
                <Badge variant="outline" className="gap-1.5 py-1 px-2 font-normal border-dashed border-primary/40 bg-transparent">
                  <div className="w-2 h-2 rounded-full bg-primary/40" /> Predicted
                </Badge>
                <Badge variant="outline" className="gap-1.5 py-1 px-2 font-normal border-green-500/30 bg-green-500/10 dark:border-green-400/30 dark:bg-green-400/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" /> Fertile
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 flex justify-center bg-card/50">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className={cn(
                "w-full max-w-full sm:max-w-none [&_.rdp-month]:w-full [&_.rdp-table]:w-full",
                "[&_.period-day_button]:bg-primary [&_.period-day_button]:text-primary-foreground [&_.period-day_button]:rounded-full [&_.period-day_button]:shadow-md [&_.period-day_button]:hover:bg-primary/90",
                "[&_.predicted-day_button]:border-2 [&_.predicted-day_button]:border-primary/30 [&_.predicted-day_button]:text-primary [&_.predicted-day_button]:rounded-full",
                "[&_.fertile-day_button]:bg-green-500/20 [&_.fertile-day_button]:text-green-700 dark:[&_.fertile-day_button]:text-green-300 [&_.fertile-day_button]:rounded-full [&_.fertile-day_button]:font-medium",
                "[&_.ovulation-day_button]:bg-green-500 [&_.ovulation-day_button]:text-white [&_.ovulation-day_button]:rounded-full [&_.ovulation-day_button]:font-bold [&_.ovulation-day_button]:shadow-lg [&_.ovulation-day_button]:ring-2 [&_.ovulation-day_button]:ring-green-500/30"
              )}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
          </CardContent>
          <div className="sm:hidden p-4 border-t border-border/40 bg-muted/20 flex flex-wrap gap-3 justify-center">
             <div className="flex items-center gap-1.5 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-primary" /> Period
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary/40" /> Predicted
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Fertile
              </div>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          
          <Card className={cn("border-border/50 shadow-sm transition-all duration-300", selectedDate && "ring-1 ring-primary/20")}>
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
               <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedDate ? selectedDate.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' }) : 'Select a date'}
                    </CardTitle>
                    <CardDescription>
                      {selectedDate ? selectedDate.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric' }) : 'View details'}
                    </CardDescription>
                  </div>
                  {selectedDate && existingLog && !isShareView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
               </div>
            </CardHeader>
            <CardContent className="pt-6 min-h-[140px]">
              {selectedDate ? (
                existingLog ? (
                  <div className="space-y-5">
                    {existingLog.flow_intensity && (
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Flow</Label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50 border border-pink-100">
                          <Droplet className="h-5 w-5 text-pink-500 fill-pink-500" />
                          <span className="capitalize font-medium text-pink-900">{existingLog.flow_intensity}</span>
                        </div>
                      </div>
                    )}
                    
                    {existingLog.symptoms && existingLog.symptoms.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Symptoms</Label>
                        <div className="flex flex-wrap gap-2">
                          {existingLog.symptoms.map(s => (
                            <Badge key={s} variant="secondary" className="px-2.5 py-1 bg-secondary/50 hover:bg-secondary transition-colors">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {existingLog.notes && (
                      <div className="space-y-2">
                         <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes</Label>
                         <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground italic border border-border/30">
                           "{existingLog.notes}"
                         </div>
                      </div>
                    )}

                    {!existingLog.flow_intensity && (!existingLog.symptoms || existingLog.symptoms.length === 0) && !existingLog.notes && (
                       <div className="text-center py-6 text-muted-foreground">
                          <p>Entry exists but contains no details.</p>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
                    <div className="p-3 bg-muted rounded-full">
                      <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No entry for this date</p>
                      {!isShareView && (
                        <p className="text-sm text-muted-foreground">Log your period or symptoms to track your cycle.</p>
                      )}
                    </div>
                    {!isShareView && (
                      <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-2">
                        Add Log
                      </Button>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center text-muted-foreground">
                  <p>Select a date on the calendar to view or edit details.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col border-border/50 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Recent Cycles</CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">Last 6</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[300px] pr-2 custom-scrollbar">
              {recentCycles.length > 0 ? (
                <div className="space-y-3">
                  {recentCycles.map((cycle, i) => (
                    <div key={i} className="group flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/50 rounded-xl transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full bg-gradient-to-b from-primary/50 to-primary/10" />
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date(cycle.end).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-lg font-bold text-foreground">{cycle.length}</span>
                         <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : periodLogs.filter(p => p.is_period_day).length > 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                   <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <Activity className="h-6 w-6 text-primary" />
                   </div>
                   <p className="font-medium text-foreground">Tracking your first cycle</p>
                   <p className="text-sm text-muted-foreground mt-1 px-4">
                    Continue logging your period to see your cycle history build up here.
                   </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <p className="text-sm">Log your first period to start tracking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Cycle History</CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">Last 6 cycles</Badge>
              </div>
              <CardDescription>Your recorded menstrual cycles</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {recentCycles.length > 0 ? (
                <div className="space-y-3">
                  {recentCycles.map((cycle, i) => (
                    <div key={i} className="group flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/50 rounded-xl transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-primary to-primary/20" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })}
                            {' - '}
                            {new Date(cycle.end).toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(cycle.start).toLocaleDateString('en-AU', { year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-2xl font-bold text-foreground">{cycle.length}</span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">days</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : periodLogs.filter(p => p.is_period_day).length > 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-lg">Building Your History</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Continue logging your period to see your cycle history appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">No cycles recorded yet</p>
                  <p className="text-sm mt-1">Start logging your period to build your history</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Cycle Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{settings.average_cycle_length}</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Period Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{settings.average_period_length}</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cycles Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{recentCycles.length}</span>
                  <span className="text-sm text-muted-foreground">total</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!isShareView && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Log Details
              </DialogTitle>
              <DialogDescription>
                {selectedDate?.toLocaleDateString('en-AU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/80">Flow Intensity</Label>
                <div className="grid grid-cols-4 gap-2">
                  {FLOW_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedFlow(selectedFlow === option.value ? null : option.value)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 gap-1.5",
                        selectedFlow === option.value 
                          ? cn(option.color, "border-transparent shadow-sm scale-105") 
                          : "bg-background border-border hover:border-pink-200 hover:bg-pink-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        selectedFlow === option.value ? "bg-white/90" : option.color.split(' ')[0]
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        selectedFlow === option.value ? "text-white" : "text-muted-foreground"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/80">Symptoms</Label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOM_OPTIONS.map(symptom => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                        selectedSymptoms.includes(symptom)
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/80">Notes</Label>
                <Textarea
                  placeholder="How are you feeling today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none min-h-[80px] bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </div>
             <DialogFooter className="gap-2 sm:gap-0">
                {existingLog && (
                  <Button 
                    variant="outline" 
                    onClick={handleDelete} 
                    disabled={saving}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 mr-auto"
                  >
                    Delete
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Log
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
