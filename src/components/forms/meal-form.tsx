'use client'

import { useState, useRef } from 'react'
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
import { Plus, Camera, X, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import type { MealType } from '@/hooks/use-meals'

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
]

interface MealData {
  id?: string
  date: string
  meal_type: MealType
  photo_url?: string | null
  description?: string | null
  notes?: string | null
}

interface MealFormProps {
  meal?: MealData
  onSubmit: (data: {
    date: string
    meal_type: MealType
    photo_url?: string | null
    description?: string
    notes?: string
  }) => Promise<void>
  onUploadPhoto: (file: File) => Promise<string>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MealForm({ meal, onSubmit, onUploadPhoto, trigger, open: controlledOpen, onOpenChange }: MealFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  
  const [date, setDate] = useState(meal?.date || formatDate(new Date()))
  const [mealType, setMealType] = useState<MealType | ''>(meal?.meal_type || '')
  const [description, setDescription] = useState(meal?.description || '')
  const [notes, setNotes] = useState(meal?.notes || '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(meal?.photo_url || null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(meal?.photo_url || null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isEditing = !!meal

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const url = await onUploadPhoto(file)
      setPhotoUrl(url)
    } catch (err) {
      console.error('Failed to upload photo:', err)
      setPhotoPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = () => {
    setPhotoUrl(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mealType) return

    setLoading(true)
    try {
      await onSubmit({
        date,
        meal_type: mealType,
        photo_url: photoUrl,
        description: description || undefined,
        notes: notes || undefined,
      })
      setOpen(false)
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setMealType('')
    setDescription('')
    setNotes('')
    setPhotoUrl(null)
    setPhotoPreview(null)
    setDate(formatDate(new Date()))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && !isEditing && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Meal
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Meal' : 'Log Meal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMealType(type.value)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all text-sm cursor-pointer ${
                    mealType === type.value
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

          <div className="space-y-2">
            <Label>Photo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Meal preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="w-full h-32 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all active:scale-[0.98]"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Add Photo</p>
                  <p className="text-xs text-muted-foreground">Camera or gallery</p>
                </div>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What did you eat?</Label>
            <Input
              id="description"
              placeholder="e.g., Avocado toast with eggs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !mealType || uploading}>
              {loading ? 'Saving...' : isEditing ? 'Update Meal' : 'Save Meal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
