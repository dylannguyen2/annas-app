'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'

const WORKOUT_TYPES = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'weights', label: 'Weight Training', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'hiit', label: 'HIIT', icon: '💪' },
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'other', label: 'Other', icon: '🎯' },
]

const INTENSITIES = [
  { value: 'light', label: 'Light', description: 'Easy effort' },
  { value: 'moderate', label: 'Moderate', description: 'Steady effort' },
  { value: 'hard', label: 'Hard', description: 'Challenging' },
  { value: 'intense', label: 'Intense', description: 'Maximum effort' },
]

interface WorkoutFormProps {
  onSubmit: (data: {
    date: string
    workout_type: string
    duration_minutes?: number
    intensity?: 'light' | 'moderate' | 'hard' | 'intense'
    notes?: string
  }) => Promise<void>
  trigger?: React.ReactNode
}

export function WorkoutForm({ onSubmit, trigger }: WorkoutFormProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(formatDate(new Date()))
  const [workoutType, setWorkoutType] = useState('')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workoutType) return

    setLoading(true)
    try {
      await onSubmit({
        date,
        workout_type: workoutType,
        duration_minutes: duration ? parseInt(duration) : undefined,
        intensity: intensity as 'light' | 'moderate' | 'hard' | 'intense' | undefined,
        notes: notes || undefined,
      })
      setOpen(false)
      setWorkoutType('')
      setDuration('')
      setIntensity('')
      setNotes('')
      setDate(formatDate(new Date()))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Workout
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Workout Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setWorkoutType(type.value)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all text-sm ${
                    workoutType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-accent'
                  }`}
                >
                  <span className="text-xl mb-1">{type.icon}</span>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Intensity</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="How did it go? Any PRs?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !workoutType}>
              {loading ? 'Saving...' : 'Save Workout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
