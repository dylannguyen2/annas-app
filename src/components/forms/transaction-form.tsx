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
import { Plus, Minus, DollarSign } from 'lucide-react'
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
      <DialogContent className="sm:max-w-md border-border/50 shadow-xl">
        <DialogHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-60" />
              <div className="relative p-2 bg-card border border-border/50 rounded-xl">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold">{initialData ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="p-1.5 bg-secondary/30 rounded-xl border border-border/30">
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="ghost"
                className={`flex-1 h-11 rounded-lg transition-all duration-200 cursor-pointer ${
                  type === 'expense' 
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm border border-red-500/20' 
                    : 'hover:bg-secondary/50 text-muted-foreground'
                }`}
                onClick={() => handleTypeChange('expense')}
              >
                <Minus className="mr-1.5 h-4 w-4" />
                Expense
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={`flex-1 h-11 rounded-lg transition-all duration-200 cursor-pointer ${
                  type === 'income' 
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400 shadow-sm border border-green-500/20' 
                    : 'hover:bg-secondary/50 text-muted-foreground'
                }`}
                onClick={() => handleTypeChange('income')}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Income
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-muted-foreground/70">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-14 text-2xl font-semibold bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 bg-secondary/30 border-border/50 cursor-pointer">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name} className="cursor-pointer">
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
            <Label htmlFor="date" className="text-sm font-medium text-muted-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/40 mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/50 cursor-pointer">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className={`shadow-sm hover:shadow-md transition-all cursor-pointer ${
                type === 'expense' 
                  ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                  : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
              }`}
            >
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
