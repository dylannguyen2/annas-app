'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

const MOOD_OPTIONS = [
  { value: 0, emoji: '😰', label: 'Panic', color: '#dc2626' },
  { value: 1, emoji: '😢', label: 'Awful', color: '#ef4444' },
  { value: 2, emoji: '😕', label: 'Bad', color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#eab308' },
  { value: 4, emoji: '🙂', label: 'Good', color: '#22c55e' },
  { value: 5, emoji: '😊', label: 'Great', color: '#10b981' },
]

interface MoodPickerProps {
  initialMood?: number
  initialEnergy?: number
  initialStress?: number
  initialNotes?: string
  date?: Date
  onDateChange?: (date: Date) => void
  onSave: (data: { mood: number; energy: number; stress: number; notes?: string; date: Date }) => Promise<void>
  compact?: boolean
  showDatePicker?: boolean
}

export function MoodPicker({ 
  initialMood, 
  initialEnergy = 3, 
  initialStress = 3,
  initialNotes = '',
  date: externalDate,
  onDateChange,
  onSave,
  compact = false,
  showDatePicker = true
}: MoodPickerProps) {
  const [mood, setMood] = useState<number | undefined>(initialMood)
  const [energy, setEnergy] = useState(initialEnergy)
  const [stress, setStress] = useState(initialStress)
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [internalDate, setInternalDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  const selectedDate = externalDate ?? internalDate
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (onDateChange) {
        onDateChange(date)
      } else {
        setInternalDate(date)
      }
      setCalendarOpen(false)
    }
  }

  const handleSave = async () => {
    if (!mood) return
    setLoading(true)
    try {
      await onSave({ mood, energy, stress, notes: notes || undefined, date: selectedDate })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setMood(option.value)
              onSave({ mood: option.value, energy: 3, stress: 3, date: selectedDate })
            }}
            className={cn(
              'flex flex-col items-center p-2 rounded-lg transition-all flex-1',
              mood === option.value
                ? 'bg-primary/20 ring-2 ring-primary'
                : 'hover:bg-accent'
            )}
          >
            <span className="text-2xl">{option.emoji}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <CardTitle>How are you feeling?</CardTitle>
          {showDatePicker && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {isToday ? 'Today' : format(selectedDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-3">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMood(option.value)}
              className={cn(
                'flex flex-col items-center p-3 rounded-xl transition-all',
                mood === option.value
                  ? 'bg-primary/20 ring-2 ring-primary scale-110'
                  : 'hover:bg-accent hover:scale-105'
              )}
            >
              <span className="text-3xl mb-1">{option.emoji}</span>
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between w-full">
              <Label>Energy Level</Label>
              <span className="text-sm text-muted-foreground">{energy}/5</span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={([v]) => setEnergy(v)}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between w-full">
              <Label>Stress Level</Label>
              <span className="text-sm text-muted-foreground">{stress}/5</span>
            </div>
            <Slider
              value={[stress]}
              onValueChange={([v]) => setStress(v)}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Relaxed</span>
              <span>Stressed</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="How was your day? What's on your mind?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!mood || loading}
          className="w-full"
        >
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Mood'}
        </Button>
      </CardContent>
    </Card>
  )
}
