'use client'

import { useState, useEffect } from 'react'
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
import { Plus, PenLine } from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'

const WORKOUT_TYPES = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'treadmill', label: 'Treadmill', icon: '🏃‍♂️' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'weights', label: 'Weights', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'hot-yoga', label: 'Hot Yoga', icon: '🔥' },
  { value: 'pilates', label: 'Pilates', icon: '🤸‍♀️' },
  { value: 'reformer', label: 'Reformer', icon: '🤸‍♀️' },
  { value: 'hiit', label: 'HIIT', icon: '💪' },
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'cardio', label: 'Cardio', icon: '💓' },
  { value: 'other', label: 'Other', icon: '🎯' },
]

const INTENSITIES = [
  { value: 'light', label: 'Light', description: 'Easy effort' },
  { value: 'moderate', label: 'Moderate', description: 'Steady effort' },
  { value: 'hard', label: 'Hard', description: 'Challenging' },
  { value: 'intense', label: 'Intense', description: 'Maximum effort' },
]

interface WorkoutFormData {
  date: string
  workout_type: string
  duration_minutes?: number
  calories?: number
  intensity?: 'light' | 'moderate' | 'hard' | 'intense'
  notes?: string
}

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => Promise<void>
  trigger?: React.ReactNode
  initialData?: WorkoutFormData
}

export function WorkoutForm({ onSubmit, trigger, initialData }: WorkoutFormProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(initialData?.date || formatDate(new Date()))
  const [workoutType, setWorkoutType] = useState(initialData?.workout_type || '')
  const [duration, setDuration] = useState(initialData?.duration_minutes?.toString() || '')
  const [calories, setCalories] = useState(initialData?.calories?.toString() || '')
  const [intensity, setIntensity] = useState<string>(initialData?.intensity || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      setDate(initialData.date)
      setWorkoutType(initialData.workout_type)
      setDuration(initialData.duration_minutes?.toString() || '')
      setCalories(initialData.calories?.toString() || '')
      setIntensity(initialData.intensity || '')
      setNotes(initialData.notes || '')
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workoutType) return

    setLoading(true)
    try {
      await onSubmit({
        date,
        workout_type: workoutType,
        duration_minutes: duration ? parseInt(duration) : undefined,
        calories: calories ? parseInt(calories) : undefined,
        intensity: intensity as 'light' | 'moderate' | 'hard' | 'intense' | undefined,
        notes: notes || undefined,
      })
      setOpen(false)
      if (!initialData) {
        setWorkoutType('')
        setDuration('')
        setCalories('')
        setIntensity('')
        setNotes('')
        setDate(formatDate(new Date()))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Log
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Workout' : 'Log Workout'}</DialogTitle>
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
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto [scrollbar-width:none]">
              {WORKOUT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setWorkoutType(type.value)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all cursor-pointer ${
                    workoutType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-accent'
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-[10px] leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="number"
                placeholder="min"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="kcal"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Intensity</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
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
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="How did it go?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !workoutType || !date || !duration || !intensity}>
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Save Workout')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
