'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const MOOD_OPTIONS = [
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
  onSave: (data: { mood: number; energy: number; stress: number; notes?: string }) => Promise<void>
  compact?: boolean
}

export function MoodPicker({ 
  initialMood, 
  initialEnergy = 3, 
  initialStress = 3,
  initialNotes = '',
  onSave,
  compact = false 
}: MoodPickerProps) {
  const [mood, setMood] = useState<number | undefined>(initialMood)
  const [energy, setEnergy] = useState(initialEnergy)
  const [stress, setStress] = useState(initialStress)
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!mood) return
    setLoading(true)
    try {
      await onSave({ mood, energy, stress, notes: notes || undefined })
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
              onSave({ mood: option.value, energy: 3, stress: 3 })
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
        <CardTitle>How are you feeling?</CardTitle>
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
            <div className="flex justify-between">
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
            <div className="flex justify-between">
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
