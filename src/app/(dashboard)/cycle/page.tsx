'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { usePeriods } from '@/hooks/use-periods'
import { useShareView } from '@/lib/share-view/context'
import { Loader2, Droplet, Calendar as CalendarIcon, Heart, Sparkles, Trash2 } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { formatDate } from '@/lib/utils/dates'

const FLOW_OPTIONS = [
  { value: 'spotting', label: 'Spotting', color: 'bg-pink-200' },
  { value: 'light', label: 'Light', color: 'bg-pink-300' },
  { value: 'medium', label: 'Medium', color: 'bg-pink-400' },
  { value: 'heavy', label: 'Heavy', color: 'bg-pink-500' },
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
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Droplet className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Cycle Tracker</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track your period and predict your cycle
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cycle Day</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {cycleInfo.currentCycleDay ? `Day ${cycleInfo.currentCycleDay}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cycleInfo.isOnPeriod ? 'On period' : 'Not on period'}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Period</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Droplet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {cycleInfo.nextPeriodPrediction 
                ? new Date(cycleInfo.nextPeriodPrediction).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cycleInfo.nextPeriodPrediction && (
                <>
                  {Math.ceil((new Date(cycleInfo.nextPeriodPrediction).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fertile Window</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Heart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {cycleInfo.fertileWindowStart 
                ? `${new Date(cycleInfo.fertileWindowStart).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cycleInfo.ovulationDay && (
                <>Ovulation: {new Date(cycleInfo.ovulationDay).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-0.5 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Cycle</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/15 transition-colors">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{settings.average_cycle_length} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Period: {settings.average_period_length} days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[25fr_75fr]">
        <Card className="flex flex-col">
          <CardHeader className="">
            <CardTitle className="text-base">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col pt-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md [&_.period-day_button]:bg-primary [&_.period-day_button]:text-primary-foreground [&_.period-day_button]:rounded-full [&_.predicted-day_button]:bg-primary/30 [&_.predicted-day_button]:rounded-full [&_.fertile-day_button]:bg-green-200 [&_.fertile-day_button]:rounded-full [&_.ovulation-day_button]:bg-green-400 [&_.ovulation-day_button]:text-white [&_.ovulation-day_button]:rounded-full"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Period</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary/30" />
                <span>Predicted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-200" />
                <span>Fertile</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Ovulation</span>
              </div>
            </div>

{!isShareView && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-3" size="sm" disabled={!selectedDate}>
                    {existingLog ? 'Edit Log' : 'Log Period'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedDate?.toLocaleDateString('en-AU', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Flow Intensity</Label>
                      <div className="flex gap-2">
                        {FLOW_OPTIONS.map(option => (
                          <Button
                            key={option.value}
                            variant={selectedFlow === option.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedFlow(selectedFlow === option.value ? null : option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Symptoms</Label>
                      <div className="flex flex-wrap gap-2">
                        {SYMPTOM_OPTIONS.map(symptom => (
                          <Badge
                            key={symptom}
                            variant={selectedSymptoms.includes(symptom) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleSymptom(symptom)}
                          >
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Any additional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving} className="flex-1">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                      {existingLog && (
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col">
            <CardHeader className="">
              <CardTitle className="text-base">Recent Cycles</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentCycles.length > 0 ? (
                <div className="space-y-2">
                  {recentCycles.map((cycle, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(cycle.end).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{cycle.length}d</Badge>
                    </div>
                  ))}
                </div>
              ) : periodLogs.filter(p => p.is_period_day).length > 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    Tracking your first cycle
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Log your next period to see cycle history
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  Log your first period to start tracking
                </p>
              )}
            </CardContent>
          </Card>

          {selectedDate && existingLog && (
            <Card>
              <CardHeader className="space-y-0">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-base">
                    {selectedDate.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })}
                  </CardTitle>
{!isShareView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {existingLog.flow_intensity && (
                  <div className="flex items-center gap-2">
                    <Droplet className="h-3 w-3 text-primary" />
                    <span className="capitalize text-sm">{existingLog.flow_intensity} flow</span>
                  </div>
                )}
                {existingLog.symptoms && existingLog.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {existingLog.symptoms.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
                {existingLog.notes && (
                  <p className="text-xs text-muted-foreground">{existingLog.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
