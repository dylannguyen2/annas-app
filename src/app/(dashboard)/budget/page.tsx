'use client'

import { useState, useEffect } from 'react'
import { useShareView } from '@/lib/share-view/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/forms/transaction-form'
import { BudgetLimitForm } from '@/components/forms/budget-limit-form'
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
  CalendarDays,
  LayoutDashboard,
  List,
  PieChart,
  Search,
  Filter
} from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isFuture, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
  return `$${Math.abs(amount).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getProgressColor = (percent: number) => {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 75) return 'bg-yellow-500'
  return 'bg-green-500'
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: List },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
] as const

export default function BudgetPage() {
  const { isShareView } = useShareView()
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
  
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [visibleTxCount, setVisibleTxCount] = useState(20)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  })

  useEffect(() => {
    setVisibleTxCount(20)
  }, [activeTab, transactionSearch, currentMonth])

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

  const filteredTransactions = summary?.transactions?.filter(tx => {
    if (!transactionSearch.trim()) return true
    const search = transactionSearch.toLowerCase()
    const catInfo = tx.categoryInfo || getCategoryByName(tx.category || '')
    return (
      tx.description?.toLowerCase().includes(search) ||
      catInfo?.name.toLowerCase().includes(search) ||
      tx.amount.toString().includes(search)
    )
  }) || []

  const visibleTransactions = filteredTransactions.slice(0, visibleTxCount)
  const hasMoreTransactions = filteredTransactions.length > visibleTxCount

  if (loading) {
    return <PageSkeleton />
  }

  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Budget
              </h1>
              <p className="text-muted-foreground font-medium mt-1">Track your income and expenses</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 cursor-pointer" 
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
          {!isShareView && (
            <>
              <TransactionForm
                onSubmit={handleCreateTransaction}
                defaultType="expense"
                trigger={
                  <Button variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                    <span className="sm:hidden">-$</span>
                    <Minus className="hidden sm:inline h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Expense</span>
                  </Button>
                }
              />
              <TransactionForm
                onSubmit={handleCreateTransaction}
                defaultType="income"
                trigger={
                  <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                    <span className="sm:hidden">+$</span>
                    <Plus className="hidden sm:inline h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Income</span>
                  </Button>
                }
              />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-hidden whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isShareView && (
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardContent className="p-3">
                  <form onSubmit={handleAiSubmit} className="relative">
                    <div className="relative flex items-center">
                      <div className="absolute left-3 p-1.5 bg-primary/10 rounded-lg">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <Input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Type naturally: &quot;spent $50 on groceries&quot; or &quot;got paid $3000 salary&quot;"
                        className="pl-14 pr-12 h-12 bg-background/50 border-border/50 text-base focus-visible:ring-primary/20"
                        disabled={aiLoading}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 h-8 w-8 hover:bg-primary/10 hover:text-primary cursor-pointer"
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
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <TrendingUp className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Income
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                    {formatCurrency(summary?.totalIncome || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">this month</p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <TrendingDown className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {formatCurrency(summary?.totalExpenses || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">this month</p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <PiggyBank className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap ${(summary?.netSavings || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(summary?.netSavings || 0) < 0 ? '-' : ''}{formatCurrency(summary?.netSavings || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">income - expenses</p>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 min-w-[160px] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink">
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-[-15deg] pointer-events-none">
                  <Wallet className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Budget Left
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold whitespace-nowrap ${(summary?.budgetRemaining || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(summary?.budgetRemaining || 0) < 0 ? '-' : ''}{formatCurrency(summary?.budgetRemaining || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80 whitespace-nowrap">
                    of {formatCurrency(summary?.totalBudgeted || 0)} budgeted
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4">
              <div className="hidden lg:block">
                <Card className="h-full relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {weekDays.map(day => <div key={day} className="py-1">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
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
                              relative flex flex-col items-center justify-start py-1.5 min-h-[52px] rounded-xl border transition-all duration-300 group
                              ${isCurrentMonth ? 'bg-card' : 'bg-muted/10 text-muted-foreground/30'}
                              ${isSelected ? 'ring-2 ring-primary border-primary shadow-md z-10 bg-primary/5' : 'border-border/40 hover:border-primary/30'}
                              ${isTodayDate ? 'bg-accent/40 font-semibold border-accent' : ''}
                              ${isFutureDate ? 'opacity-30 pointer-events-none' : 'cursor-pointer hover:bg-accent/20'}
                            `}
                          >
                            <span className={`
                              text-[10px] mb-0.5 w-6 h-6 flex items-center justify-center rounded-full transition-colors
                              ${isTodayDate ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                              ${isSelected && !isTodayDate ? 'text-primary font-bold' : ''}
                            `}>
                              {format(day, 'd')}
                            </span>
                            {dayTxs.length > 0 && (
                              <div className="flex gap-0.5 mt-auto mb-0.5">
                                {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:scale-110 transition-transform" />}
                                {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-green-500 group-hover:scale-110 transition-transform" />}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/40">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="font-medium">Expense</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="font-medium">Income</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col">
                {selectedDate ? (
                  <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent h-full flex flex-col relative overflow-hidden animate-in fade-in duration-300 slide-in-from-right-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base font-semibold">
                          {format(selectedDate, 'MMMM d, yyyy')}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-primary/10" onClick={() => setSelectedDate(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="relative overflow-hidden p-3 bg-card/60 rounded-xl border border-green-500/20 shadow-sm backdrop-blur-sm">
                          <div className="absolute -bottom-2 -right-2 opacity-[0.05]">
                            <TrendingUp className="w-12 h-12" />
                          </div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Income</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">+{formatCurrency(selectedDateStats.income)}</p>
                        </div>
                        <div className="relative overflow-hidden p-3 bg-card/60 rounded-xl border border-red-500/20 shadow-sm backdrop-blur-sm">
                          <div className="absolute -bottom-2 -right-2 opacity-[0.05]">
                            <TrendingDown className="w-12 h-12" />
                          </div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Expenses</p>
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">-{formatCurrency(selectedDateStats.expense)}</p>
                        </div>
                        <div className={`relative overflow-hidden p-3 rounded-xl border shadow-sm backdrop-blur-sm ${selectedDateStats.net >= 0 ? 'bg-card/60 border-green-500/20' : 'bg-card/60 border-red-500/20'}`}>
                          <div className="absolute -bottom-2 -right-2 opacity-[0.05]">
                            <PiggyBank className="w-12 h-12" />
                          </div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Net</p>
                          <p className={`text-lg font-bold ${selectedDateStats.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {selectedDateStats.net >= 0 ? '+' : '-'}{formatCurrency(selectedDateStats.net)}
                          </p>
                        </div>
                      </div>

                      {selectedDateTransactions.length > 0 ? (
                        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
                          {selectedDateTransactions.map((tx: Transaction) => {
                            const catInfo = tx.categoryInfo || getCategoryByName(tx.category || '')
                            return (
                              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl p-2 bg-muted/20 rounded-xl group-hover:bg-primary/10 transition-colors">
                                    {catInfo?.icon || '📦'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{tx.description || catInfo?.name || 'Transaction'}</p>
                                    {catInfo && <p className="text-xs text-muted-foreground">{catInfo.name}</p>}
                                  </div>
                                </div>
                                <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                            <Wallet className="h-8 w-8 opacity-20" />
                          </div>
                          <p className="font-medium">No transactions recorded</p>
                          <p className="text-sm opacity-70 mb-4">Add your first transaction for this day</p>
                          {!isShareView && (
                            <div className="flex justify-center gap-2">
                              <TransactionForm
                                onSubmit={handleCreateTransaction}
                                defaultType="expense"
                                trigger={<Button variant="outline" size="sm" className="cursor-pointer"><Minus className="mr-1.5 h-3 w-3" />Expense</Button>}
                              />
                              <TransactionForm
                                onSubmit={handleCreateTransaction}
                                defaultType="income"
                                trigger={<Button size="sm" className="cursor-pointer"><Plus className="mr-1.5 h-3 w-3" />Income</Button>}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border rounded-xl border-dashed border-border/50 bg-muted/5">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold text-lg text-foreground">Select a date</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Click on a date in the calendar to view and manage transactions for that specific day.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Transactions History</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    className="pl-9 h-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
                  />
                  {transactionSearch && (
                    <button
                      onClick={() => setTransactionSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {visibleTransactions.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {visibleTransactions.map((tx: Transaction) => {
                      const catInfo = tx.categoryInfo || getCategoryByName(tx.category || '')
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="text-xl p-2 bg-secondary/30 rounded-xl group-hover:bg-primary/10 transition-colors">
                              {catInfo?.icon || '📦'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.description || catInfo?.name || 'Transaction'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.date), 'EEE, MMM d')}
                                {catInfo && ` · ${catInfo.name}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isShareView && (
                              <>
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
                                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <span className={`text-sm font-bold min-w-[80px] text-right ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {hasMoreTransactions && (
                      <div className="p-4 text-center border-t border-border/40">
                        <Button 
                          variant="outline" 
                          onClick={() => setVisibleTxCount(prev => prev + 20)}
                          className="w-full sm:w-auto"
                        >
                          Load More
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      {transactionSearch ? <Search className="h-8 w-8 opacity-20" /> : <Wallet className="h-8 w-8 opacity-20" />}
                    </div>
                    <p className="font-medium">{transactionSearch ? 'No matching transactions' : 'No transactions this month'}</p>
                    <p className="text-sm opacity-70">
                      {transactionSearch ? 'Try a different search term' : 'Add transactions to see them here'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="border-b border-border/40 bg-muted/10 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
                {!isShareView && (
                  <BudgetLimitForm month={currentMonth} />
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {summary?.categoryBreakdown && summary.categoryBreakdown.filter(c => c.type === 'expense').length > 0 ? (
                  <div className="space-y-5">
                    {summary.categoryBreakdown
                      .filter(c => c.type === 'expense' && (c.spent > 0 || c.budgetAmount > 0))
                      .sort((a, b) => b.spent - a.spent)
                      .map((cat: CategoryBreakdown) => (
                        <div key={cat.id} className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-xl p-2 bg-secondary/30 rounded-xl">
                                {cat.icon}
                              </div>
                              <span className="text-sm font-semibold">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold">{formatCurrency(cat.spent)}</span>
                              {cat.budgetAmount > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">/ {formatCurrency(cat.budgetAmount)}</span>
                              )}
                            </div>
                          </div>
                          <div className="relative h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                            <div 
                              className={`absolute h-full ${getProgressColor(cat.percentUsed)} transition-all duration-500 rounded-full`}
                              style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                            />
                          </div>
                          {cat.budgetAmount > 0 && (
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              <span>{cat.percentUsed.toFixed(0)}% Used</span>
                              <span>{formatCurrency(Math.max(0, cat.budgetAmount - cat.spent))} left</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <PiggyBank className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">No spending recorded</p>
                    <p className="text-sm opacity-70">Add transactions to see category breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
