'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/forms/transaction-form'
import { 
  useBudgetSummary, 
  type Transaction,
  type CategoryBreakdown,
  getCategoryByName
} from '@/hooks/use-budget'
import { Input } from '@/components/ui/input'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Send,
  Pencil,
  X,
  CalendarDays
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isFuture, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { toast } from 'sonner'

const formatCurrency = (amount: number) => {
  return `$${Math.abs(amount).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getProgressColor = (percent: number) => {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 75) return 'bg-yellow-500'
  return 'bg-green-500'
}

export default function BudgetPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const { 
    summary, 
    loading, 
    error, 
    createTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useBudgetSummary(currentMonth)
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  })

  const getTransactionsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return summary?.transactions?.filter(t => t.date === dateStr) || []
  }

  const getDayTotal = (day: Date) => {
    const txs = getTransactionsForDay(day)
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    return { income, expense, net: income - expense }
  }

  const selectedDateTransactions = selectedDate ? getTransactionsForDay(selectedDate) : []
  const selectedDateStats = selectedDate ? getDayTotal(selectedDate) : { income: 0, expense: 0, net: 0 }

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    setAiLoading(true)
    try {
      const parseRes = await fetch('/api/budget/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: aiInput }),
      })
      
      if (!parseRes.ok) throw new Error('Failed to parse')
      const parsed = await parseRes.json()

      if (!parsed.amount) {
        toast.error("Couldn't understand the amount")
        return
      }

      await createTransaction({
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: parsed.date,
      })

      toast.success(`Added ${parsed.type}: $${parsed.amount} - ${parsed.category || 'Other'}`)
      setAiInput('')
    } catch {
      toast.error('Failed to add transaction')
    } finally {
      setAiLoading(false)
    }
  }

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1)
    if (next <= new Date()) setCurrentMonth(next)
  }

  const handleCreateTransaction = async (data: {
    category?: string
    type: 'expense' | 'income'
    amount: number
    description?: string
    date: string
    notes?: string
  }) => {
    try {
      await createTransaction(data)
      toast.success(`${data.type === 'expense' ? 'Expense' : 'Income'} added`)
    } catch {
      toast.error('Failed to add transaction')
    }
  }

  const handleEditTransaction = async (id: string, data: {
    category?: string
    type: 'expense' | 'income'
    amount: number
    description?: string
    date: string
    notes?: string
  }) => {
    try {
      await updateTransaction(id, data)
      toast.success('Transaction updated')
    } catch {
      toast.error('Failed to update transaction')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted')
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget</h2>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative lg:hidden">
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {selectedDate ? (isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')) : 'Select date'}
            </Button>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  const date = parseISO(e.target.value)
                  setSelectedDate(date)
                  if (!isSameMonth(date, currentMonth)) {
                    setCurrentMonth(startOfMonth(date))
                  }
                }
              }}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>
          <TransactionForm
            onSubmit={handleCreateTransaction}
            defaultType="expense"
            trigger={
              <Button variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                <Minus className="mr-1.5 h-4 w-4" />
                Expense
              </Button>
            }
          />
          <TransactionForm
            onSubmit={handleCreateTransaction}
            defaultType="income"
            trigger={
              <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                <Plus className="mr-1.5 h-4 w-4" />
                Income
              </Button>
            }
          />
        </div>
      </div>

      <form onSubmit={handleAiSubmit} className="relative">
        <div className="relative flex items-center">
          <Sparkles className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Type naturally: &quot;spent $50 on groceries&quot; or &quot;got paid $3000 salary&quot;"
            className="pl-10 pr-12 h-11 bg-secondary/50 border-secondary"
            disabled={aiLoading}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-1 h-9 w-9"
            disabled={aiLoading || !aiInput.trim()}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-blue-600" />
              Net Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.netSavings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary?.netSavings || 0) < 0 ? '-' : ''}{formatCurrency(summary?.netSavings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">income - expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-600" />
              Budget Left
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.budgetRemaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary?.budgetRemaining || 0) < 0 ? '-' : ''}{formatCurrency(summary?.budgetRemaining || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(summary?.totalBudgeted || 0)} budgeted
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-full lg:w-[350px] shrink-0">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                {weekDays.map(day => <div key={day} className="py-1">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayTxs = getTransactionsForDay(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isTodayDate = isToday(day)
                  const isFutureDate = isFuture(day)
                  const hasExpense = dayTxs.some(t => t.type === 'expense')
                  const hasIncome = dayTxs.some(t => t.type === 'income')
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !isFutureDate && setSelectedDate(isSelected ? null : day)}
                      disabled={isFutureDate}
                      className={`
                        relative flex flex-col items-center justify-start py-1 min-h-[48px] rounded-md border transition-all
                        ${isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground/50'}
                        ${isSelected ? 'ring-2 ring-primary border-primary z-10' : 'border-border/50'}
                        ${isTodayDate ? 'bg-accent/50' : ''}
                        ${isFutureDate ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'}
                      `}
                    >
                      <span className={`
                        text-[11px] w-5 h-5 flex items-center justify-center rounded-full
                        ${isTodayDate ? 'bg-primary text-primary-foreground font-bold' : ''}
                        ${isSelected && !isTodayDate ? 'text-primary font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      {dayTxs.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Expense</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Income</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedDate ? (
            <Card className="border-primary/20 bg-primary/5 h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Income</p>
                    <p className="text-lg font-bold text-green-600">+{formatCurrency(selectedDateStats.income)}</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                    <p className="text-lg font-bold text-red-600">-{formatCurrency(selectedDateStats.expense)}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${selectedDateStats.net >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-xs text-muted-foreground mb-1">Net</p>
                    <p className={`text-lg font-bold ${selectedDateStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedDateStats.net >= 0 ? '+' : '-'}{formatCurrency(selectedDateStats.net)}
                    </p>
                  </div>
                </div>

                {selectedDateTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateTransactions.map((tx: Transaction) => {
                      const catInfo = tx.categoryInfo || getCategoryByName(tx.category || '')
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{catInfo?.icon || '📦'}</span>
                            <div>
                              <p className="text-sm font-medium">{tx.description || catInfo?.name || 'Transaction'}</p>
                              {catInfo && <p className="text-xs text-muted-foreground">{catInfo.name}</p>}
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No transactions on this day</p>
                    <div className="flex justify-center gap-2 mt-3">
                      <TransactionForm
                        onSubmit={handleCreateTransaction}
                        defaultType="expense"
                        trigger={<Button variant="outline" size="sm"><Minus className="mr-1.5 h-3 w-3" />Expense</Button>}
                      />
                      <TransactionForm
                        onSubmit={handleCreateTransaction}
                        defaultType="income"
                        trigger={<Button size="sm"><Plus className="mr-1.5 h-3 w-3" />Income</Button>}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {summary?.transactions && summary.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {summary.transactions.slice(0, 10).map((tx: Transaction) => {
                      const catInfo = tx.categoryInfo || getCategoryByName(tx.category || '')
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{catInfo?.icon || '📦'}</span>
                            <div>
                              <p className="text-sm font-medium">{tx.description || catInfo?.name || 'Transaction'}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM d')}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No transactions this month</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {summary?.categoryBreakdown && summary.categoryBreakdown.filter(c => c.type === 'expense').length > 0 ? (
            <div className="space-y-4">
              {summary.categoryBreakdown
                .filter(c => c.type === 'expense' && (c.spent > 0 || c.budgetAmount > 0))
                .sort((a, b) => b.spent - a.spent)
                .map((cat: CategoryBreakdown) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(cat.spent)}</span>
                        {cat.budgetAmount > 0 && (
                          <span className="text-xs text-muted-foreground"> / {formatCurrency(cat.budgetAmount)}</span>
                        )}
                      </div>
                    </div>
                    {cat.budgetAmount > 0 && (
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(cat.percentUsed)} transition-all`}
                          style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No spending recorded this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {summary?.transactions && summary.transactions.length > 0 ? (
            <div className="space-y-2">
              {summary.transactions.slice(0, 20).map((tx: Transaction) => {
                const catInfo = tx.categoryInfo || getCategoryByName(tx.category || '')
                return (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {catInfo?.icon || (tx.type === 'income' ? '💰' : '📦')}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {tx.description || catInfo?.name || (tx.type === 'income' ? 'Income' : 'Expense')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.date), 'MMM d')}
                          {catInfo && ` · ${catInfo.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <TransactionForm
                        onSubmit={(data) => handleEditTransaction(tx.id, data)}
                        defaultType={tx.type}
                        initialData={{
                          category: tx.category || undefined,
                          type: tx.type,
                          amount: tx.amount,
                          description: tx.description || undefined,
                          date: tx.date,
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteTransaction(tx.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking your spending</p>
              <div className="flex justify-center gap-2">
                <TransactionForm
                  onSubmit={handleCreateTransaction}
                  defaultType="expense"
                  trigger={
                    <Button variant="outline">
                      <Minus className="mr-1.5 h-4 w-4" />
                      Add Expense
                    </Button>
                  }
                />
                <TransactionForm
                  onSubmit={handleCreateTransaction}
                  defaultType="income"
                  trigger={
                    <Button>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add Income
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
