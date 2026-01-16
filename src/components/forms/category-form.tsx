'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const ICON_OPTIONS = [
  '🍔', '🛒', '🚗', '🛍️', '🎬', '📱', '💊', '✈️', '📺', '💰', '💻', '📈', '💵', '🏠', '🎮', '☕', '🍕', '👕', '💇', '🎁', '📦'
]

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#6b7280'
]

interface CategoryFormProps {
  onSubmit: (data: {
    name: string
    icon: string
    color: string
    type: 'expense' | 'income'
  }) => Promise<void>
  trigger?: React.ReactNode
  initialData?: {
    name: string
    icon: string
    color: string
    type: 'expense' | 'income'
  }
}

export function CategoryForm({ onSubmit, trigger, initialData }: CategoryFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialData?.name || '')
  const [icon, setIcon] = useState(initialData?.icon || '📦')
  const [color, setColor] = useState(initialData?.color || '#6b7280')
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type || 'expense')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), icon, color, type })
      setOpen(false)
      if (!initialData) {
        setName('')
        setIcon('📦')
        setColor('#6b7280')
        setType('expense')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Coffee, Gym, Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'expense' | 'income')}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <SelectItem value="expense" className="cursor-pointer">Expense</SelectItem>
                <SelectItem value="income" className="cursor-pointer">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-9 h-9 text-lg rounded-lg transition-all cursor-pointer ${
                    icon === i ? 'bg-primary text-primary-foreground scale-110' : 'bg-secondary hover:bg-accent'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
              style={{ backgroundColor: `${color}20` }}
            >
              <span className="text-xl">{icon}</span>
              <span className="font-medium" style={{ color }}>{name || 'Preview'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="cursor-pointer">
              {loading ? 'Saving...' : (initialData ? 'Save' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
