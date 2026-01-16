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
import { Plus } from 'lucide-react'
import type { Habit } from '@/types/database'

const ICONS = ['✓', '💪', '📚', '🧘', '💧', '🏃', '💤', '🥗', '💊', '🎯', '✍️', '🧠']
const COLORS = [
  '#ec4899', '#f43f5e', '#f97316', '#eab308', 
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6',
  '#d946ef', '#6366f1', '#0ea5e9', '#84cc16'
]

interface HabitFormProps {
  habit?: Habit
  onSubmit: (data: { name: string; icon: string; color: string }) => Promise<void>
  trigger?: React.ReactNode
}

export function HabitForm({ habit, onSubmit, trigger }: HabitFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(habit?.name || '')
  const [icon, setIcon] = useState(habit?.icon || '✓')
  const [color, setColor] = useState(habit?.color || '#ec4899')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), icon, color })
      setOpen(false)
      if (!habit) {
        setName('')
        setIcon('✓')
        setColor('#ec4899')
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
            <Plus className="mr-2 h-4 w-4" />
            Add Habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border/50 shadow-xl">
        <DialogHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-60" />
              <div className="relative p-2 bg-card border border-border/50 rounded-xl">
                <Plus className="h-5 w-5 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold">{habit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {name.trim() && (
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/30">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center text-lg text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
              <span className="font-medium text-foreground">{name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Habit Name</Label>
            <Input
              id="name"
              placeholder="e.g., Morning meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Icon</Label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-secondary/20 rounded-xl border border-border/30">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`h-11 w-11 rounded-xl text-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    icon === i
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                      : 'bg-card hover:bg-accent/50 hover:scale-105 border border-transparent hover:border-border/50'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Color</Label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-secondary/20 rounded-xl border border-border/30">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-11 w-11 rounded-xl transition-all duration-200 hover:scale-110 cursor-pointer ${
                    color === c 
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground shadow-lg scale-105' 
                      : 'hover:ring-2 hover:ring-border/50 hover:ring-offset-1 hover:ring-offset-background'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border/40 mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="shadow-sm hover:shadow-md transition-shadow">
              {loading ? 'Saving...' : habit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
