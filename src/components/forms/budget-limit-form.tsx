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
import { Settings2, Loader2 } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/lib/constants/budget-categories'
import { useBudgetLimits, type BudgetPeriod } from '@/hooks/use-budget-limits'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BudgetLimitFormProps {
  month: Date
  trigger?: React.ReactNode
}

export function BudgetLimitForm({ month, trigger }: BudgetLimitFormProps) {
  const [open, setOpen] = useState(false)
  const { budgets, setBudgetLimit, loading } = useBudgetLimits(month)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [localValues, setLocalValues] = useState<Record<string, { amount: string; period: BudgetPeriod }>>({})

  const getBudgetForCategory = (categoryId: string) => {
    return budgets.find(b => b.category_id === categoryId)
  }

  const getLocalOrSaved = (categoryId: string) => {
    if (localValues[categoryId]) {
      return localValues[categoryId]
    }
    const saved = getBudgetForCategory(categoryId)
    return {
      amount: saved?.amount?.toString() || '',
      period: saved?.period || 'monthly' as BudgetPeriod,
    }
  }

  const handleAmountChange = (categoryId: string, value: string) => {
    const current = getLocalOrSaved(categoryId)
    setLocalValues(prev => ({
      ...prev,
      [categoryId]: { ...current, amount: value },
    }))
  }

  const handlePeriodChange = (categoryId: string, period: BudgetPeriod) => {
    const current = getLocalOrSaved(categoryId)
    setLocalValues(prev => ({
      ...prev,
      [categoryId]: { ...current, period },
    }))
  }

  const handleSave = async (categoryId: string) => {
    const values = getLocalOrSaved(categoryId)
    const amount = parseFloat(values.amount)
    
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSavingId(categoryId)
    try {
      await setBudgetLimit(categoryId, amount, values.period)
      toast.success('Budget limit saved')
      setLocalValues(prev => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
    } catch {
      toast.error('Failed to save budget limit')
    } finally {
      setSavingId(null)
    }
  }

  const hasChanges = (categoryId: string) => {
    const local = localValues[categoryId]
    if (!local) return false
    const saved = getBudgetForCategory(categoryId)
    const savedAmount = saved?.amount?.toString() || ''
    const savedPeriod = saved?.period || 'monthly'
    return local.amount !== savedAmount || local.period !== savedPeriod
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Set Budgets
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle>Set Budget Limits</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {EXPENSE_CATEGORIES.map((cat) => {
              const values = getLocalOrSaved(cat.id)
              const isSaving = savingId === cat.id
              const changed = hasChanges(cat.id)

              return (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-medium">{cat.name}</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={values.amount}
                          onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                          className="pl-7 h-9"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="flex rounded-lg border border-border/50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handlePeriodChange(cat.id, 'weekly')}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                            values.period === 'weekly'
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-muted text-muted-foreground"
                          )}
                        >
                          Weekly
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePeriodChange(cat.id, 'monthly')}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                            values.period === 'monthly'
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-muted text-muted-foreground"
                          )}
                        >
                          Monthly
                        </button>
                      </div>
                      {changed && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(cat.id)}
                          disabled={isSaving}
                          className="h-9 px-3 cursor-pointer"
                        >
                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
