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
import { Loader2, Droplet, Calendar as CalendarIcon, Heart, Sparkles } from 'lucide-react'
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cycle Tracker</h2>
          <p className="text-muted-foreground text-sm">
            Track your period and predict your cycle
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Cycle Day</span>
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">
            {cycleInfo.currentCycleDay ? `Day ${cycleInfo.currentCycleDay}` : '--'}
          </div>
          <p className="text-xs text-muted-foreground">
            {cycleInfo.isOnPeriod ? 'On period' : 'Not on period'}
          </p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Next Period</span>
            <Droplet className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">
            {cycleInfo.nextPeriodPrediction 
              ? new Date(cycleInfo.nextPeriodPrediction).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
              : '--'
            }
          </div>
          <p className="text-xs text-muted-foreground">
            {cycleInfo.nextPeriodPrediction && (
              <>
                {Math.ceil((new Date(cycleInfo.nextPeriodPrediction).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
              </>
            )}
          </p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Fertile Window</span>
            <Heart className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">
            {cycleInfo.fertileWindowStart 
              ? `${new Date(cycleInfo.fertileWindowStart).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`
              : '--'
            }
          </div>
          <p className="text-xs text-muted-foreground">
            {cycleInfo.ovulationDay && (
              <>Ovulation: {new Date(cycleInfo.ovulationDay).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</>
            )}
          </p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Avg Cycle</span>
            <Sparkles className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{settings.average_cycle_length} days</div>
          <p className="text-xs text-muted-foreground">
            Period: {settings.average_period_length} days
          </p>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
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
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
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
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  Log your first period to start tracking
                </p>
              )}
            </CardContent>
          </Card>

          {selectedDate && existingLog && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedDate.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })}
                </CardTitle>
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
