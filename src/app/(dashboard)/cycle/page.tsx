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

  const modifiersStyles = {
    period: { backgroundColor: 'hsl(var(--primary))', color: 'white', borderRadius: '50%' },
    predicted: { backgroundColor: 'hsl(var(--primary) / 0.3)', borderRadius: '50%' },
    fertile: { backgroundColor: 'hsl(142 76% 85%)', borderRadius: '50%' },
    ovulation: { backgroundColor: 'hsl(142 76% 65%)', color: 'white', borderRadius: '50%' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cycle Tracker</h2>
        <p className="text-muted-foreground">
          Track your period and predict your cycle
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cycle Day</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycleInfo.currentCycleDay ? `Day ${cycleInfo.currentCycleDay}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {cycleInfo.isOnPeriod ? 'On period' : 'Not on period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Period</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fertile Window</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cycle</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.average_cycle_length} days</div>
            <p className="text-xs text-muted-foreground">
              Period: {settings.average_period_length} days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Tap a date to log or edit</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Period</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary/30" />
                <span>Predicted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 85%)' }} />
                <span>Fertile</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 65%)' }} />
                <span>Ovulation</span>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-4" disabled={!selectedDate}>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Cycles</CardTitle>
              <CardDescription>Your cycle history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCycles.length > 0 ? (
                <div className="space-y-3">
                  {recentCycles.map((cycle, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(cycle.end).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(cycle.start).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant="secondary">{cycle.length} days</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Log your first period to start tracking cycles
                </p>
              )}
            </CardContent>
          </Card>

          {selectedDate && existingLog && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingLog.flow_intensity && (
                  <div className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-primary" />
                    <span className="capitalize">{existingLog.flow_intensity} flow</span>
                  </div>
                )}
                {existingLog.symptoms && existingLog.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingLog.symptoms.map(s => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                )}
                {existingLog.notes && (
                  <p className="text-sm text-muted-foreground">{existingLog.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
