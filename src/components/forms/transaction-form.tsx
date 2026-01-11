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
import { Plus, Minus } from 'lucide-react'
import { format } from 'date-fns'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants/budget-categories'

interface TransactionFormProps {
  onSubmit: (data: {
    category?: string
    type: 'expense' | 'income'
    amount: number
    description?: string
    date: string
    notes?: string
  }) => Promise<void>
  trigger?: React.ReactNode
  defaultType?: 'expense' | 'income'
  initialData?: {
    category?: string
    type: 'expense' | 'income'
    amount: number
    description?: string
    date: string
    notes?: string
  }
}

export function TransactionForm({ 
  onSubmit,
  trigger, 
  defaultType = 'expense',
  initialData 
}: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type || defaultType)
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [loading, setLoading] = useState(false)

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    setLoading(true)
    try {
      await onSubmit({
        category: category || undefined,
        type,
        amount: parseFloat(amount),
        description: description || undefined,
        date,
        notes: notes || undefined,
      })
      setOpen(false)
      if (!initialData) {
        setAmount('')
        setCategory('')
        setDescription('')
        setNotes('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType)
    setCategory('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={`flex-1 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              <Minus className="mr-1.5 h-4 w-4" />
              Expense
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={`flex-1 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Income
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className={type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
