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
import { CalendarIcon, Save, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

const MOOD_OPTIONS = [
  { value: 0, emoji: '😰', label: 'Panic' },
  { value: 1, emoji: '😢', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
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
    if (mood === undefined) return
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
              'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 flex-1 aspect-square',
              mood === option.value
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-secondary/50 hover:bg-primary/10 hover:scale-105'
            )}
          >
            <span className="text-2xl filter drop-shadow-sm">{option.emoji}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-none shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 space-y-4">
        <div className="flex w-full items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-light tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              How are you feeling?
            </CardTitle>
          </div>
          {showDatePicker && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 rounded-full px-3 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">{isToday ? 'Today' : format(selectedDate, 'MMM d')}</span>
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
      <CardContent className="space-y-8">
        <div className="grid grid-cols-6 gap-2 sm:gap-4">
          {MOOD_OPTIONS.map((option) => {
             const isSelected = mood === option.value;
             return (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                className={cn(
                  'group relative flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-lg scale-110 z-10'
                    : 'bg-secondary/30 hover:bg-primary/10 hover:scale-105'
                )}
              >
                <span className={cn(
                  "text-4xl mb-2 transition-transform duration-300 filter",
                  isSelected ? "scale-110 drop-shadow-md" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
                )}>
                  {option.emoji}
                </span>
                <span className={cn(
                  "text-[10px] font-medium tracking-wide uppercase transition-colors",
                  isSelected ? "text-primary-foreground/90" : "text-muted-foreground group-hover:text-primary"
                )}>
                  {option.label}
                </span>
                
                {isSelected && (
                  <span className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background" />
                )}
              </button>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-4 p-4 rounded-2xl bg-secondary/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Energy</Label>
              <span className="text-sm font-bold bg-background/50 px-2 py-0.5 rounded-md min-w-[30px] text-center">{energy}/5</span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={([v]) => setEnergy(v)}
              min={1}
              max={5}
              step={1}
              className="py-2 cursor-grab active:cursor-grabbing"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-2xl bg-secondary/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stress</Label>
              <span className="text-sm font-bold bg-background/50 px-2 py-0.5 rounded-md min-w-[30px] text-center">{stress}/5</span>
            </div>
            <Slider
              value={[stress]}
              onValueChange={([v]) => setStress(v)}
              min={1}
              max={5}
              step={1}
              className="py-2 cursor-grab active:cursor-grabbing"
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
              <span>Relaxed</span>
              <span>Stressed</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Notes</Label>
          <Textarea
            placeholder="What's on your mind?..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none border-dashed border-2 focus:border-solid bg-transparent rounded-xl focus:ring-0 transition-all placeholder:text-muted-foreground/40"
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={mood === undefined || loading}
          className={cn(
            "w-full h-12 text-lg font-medium rounded-xl transition-all duration-300",
            saved ? "bg-green-500 hover:bg-green-600" : ""
          )}
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </span>
          ) : saved ? (
            <span className="flex items-center gap-2 animate-in-up">
              <Save className="h-5 w-5" />
              Saved!
            </span>
          ) : (
            'Save Entry'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
