'use client'

import useSWR, { mutate } from 'swr'
import { format, startOfMonth } from 'date-fns'
import { ALL_CATEGORIES, getCategoryByName, type BudgetCategory } from '@/lib/constants/budget-categories'

export type { BudgetCategory } from '@/lib/constants/budget-categories'

export interface Transaction {
  id: string
  user_id: string
  category: string | null
  type: 'expense' | 'income'
  amount: number
  description: string | null
  date: string
  notes: string | null
  recurring_id: string | null
  created_at: string
  categoryInfo?: BudgetCategory | null
}

export interface CategoryBreakdown {
  id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
  spent: number
  earned: number
  budgetAmount: number
  remaining: number
  percentUsed: number
  transactionCount: number
}

export interface BudgetSummary {
  month: string
  totalIncome: number
  totalExpenses: number
  netSavings: number
  totalBudgeted: number
  budgetRemaining: number
  categoryBreakdown: CategoryBreakdown[]
  transactions: Transaction[]
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getSummaryKey = (month: string) => `/api/budget/summary?month=${month}`

export function useBudgetSummary(month: Date = new Date()) {
  const monthStr = format(startOfMonth(month), 'yyyy-MM')
  const key = getSummaryKey(monthStr)
  
  const { data, error, isLoading: loading } = useSWR<BudgetSummary>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  const createTransaction = async (txData: {
    category?: string
    type: 'expense' | 'income'
    amount: number
    description?: string
    date: string
    notes?: string
  }) => {
    const tempId = `temp-${Date.now()}`
    const categoryInfo = txData.category ? getCategoryByName(txData.category) : null
    
    const optimisticTx: Transaction = {
      id: tempId,
      user_id: '',
      category: txData.category || null,
      type: txData.type,
      amount: txData.amount,
      description: txData.description || null,
      date: txData.date,
      notes: txData.notes || null,
      recurring_id: null,
      created_at: new Date().toISOString(),
      categoryInfo,
    }

    const optimisticData = data ? {
      ...data,
      totalIncome: txData.type === 'income' ? data.totalIncome + txData.amount : data.totalIncome,
      totalExpenses: txData.type === 'expense' ? data.totalExpenses + txData.amount : data.totalExpenses,
      netSavings: txData.type === 'income' 
        ? data.netSavings + txData.amount 
        : data.netSavings - txData.amount,
      transactions: [optimisticTx, ...data.transactions],
      categoryBreakdown: data.categoryBreakdown.map(cat => {
        if (cat.name === txData.category) {
          const newSpent = txData.type === 'expense' ? cat.spent + txData.amount : cat.spent
          const newEarned = txData.type === 'income' ? cat.earned + txData.amount : cat.earned
          return {
            ...cat,
            spent: newSpent,
            earned: newEarned,
            transactionCount: cat.transactionCount + 1,
          }
        }
        return cat
      }),
    } : undefined

    try {
      await mutate(
        key,
        async () => {
          const res = await fetch('/api/budget/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData),
          })
          if (!res.ok) throw new Error('Failed to create transaction')
          const summaryRes = await fetch(key)
          return summaryRes.json()
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } catch (err) {
      throw err
    }
  }

  const updateTransaction = async (
    id: string,
    txData: {
      category?: string
      type: 'expense' | 'income'
      amount: number
      description?: string
      date: string
      notes?: string
    }
  ) => {
    const oldTx = data?.transactions.find(t => t.id === id)
    if (!oldTx || !data) return

    const categoryInfo = txData.category ? getCategoryByName(txData.category) : null
    
    const updatedTx: Transaction = {
      ...oldTx,
      category: txData.category || null,
      type: txData.type,
      amount: txData.amount,
      description: txData.description || null,
      date: txData.date,
      notes: txData.notes || null,
      categoryInfo,
    }

    const amountDelta = txData.amount - oldTx.amount
    const typeChanged = txData.type !== oldTx.type
    const categoryChanged = txData.category !== oldTx.category

    let newTotalIncome = data.totalIncome
    let newTotalExpenses = data.totalExpenses

    if (typeChanged) {
      if (oldTx.type === 'income') {
        newTotalIncome -= oldTx.amount
        newTotalExpenses += txData.amount
      } else {
        newTotalExpenses -= oldTx.amount
        newTotalIncome += txData.amount
      }
    } else {
      if (txData.type === 'income') {
        newTotalIncome += amountDelta
      } else {
        newTotalExpenses += amountDelta
      }
    }

    const optimisticData: BudgetSummary = {
      ...data,
      totalIncome: newTotalIncome,
      totalExpenses: newTotalExpenses,
      netSavings: newTotalIncome - newTotalExpenses,
      transactions: data.transactions.map(t => t.id === id ? updatedTx : t),
      categoryBreakdown: data.categoryBreakdown.map(cat => {
        let newSpent = cat.spent
        let newEarned = cat.earned
        let countDelta = 0

        if (cat.name === oldTx.category) {
          if (oldTx.type === 'expense') newSpent -= oldTx.amount
          else newEarned -= oldTx.amount
          if (categoryChanged) countDelta -= 1
        }

        if (cat.name === txData.category) {
          if (txData.type === 'expense') newSpent += txData.amount
          else newEarned += txData.amount
          if (categoryChanged) countDelta += 1
        }

        if (cat.name === oldTx.category && cat.name === txData.category && !categoryChanged) {
          countDelta = 0
        }

        if (cat.name === oldTx.category || cat.name === txData.category) {
          return {
            ...cat,
            spent: newSpent,
            earned: newEarned,
            transactionCount: cat.transactionCount + countDelta,
          }
        }
        return cat
      }),
    }

    try {
      await mutate(
        key,
        async () => {
          const res = await fetch(`/api/budget/transactions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData),
          })
          if (!res.ok) throw new Error('Failed to update transaction')
          const summaryRes = await fetch(key)
          return summaryRes.json()
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } catch (err) {
      throw err
    }
  }

  const deleteTransaction = async (id: string) => {
    const tx = data?.transactions.find(t => t.id === id)
    if (!tx || !data) return

    const optimisticData: BudgetSummary = {
      ...data,
      totalIncome: tx.type === 'income' ? data.totalIncome - tx.amount : data.totalIncome,
      totalExpenses: tx.type === 'expense' ? data.totalExpenses - tx.amount : data.totalExpenses,
      netSavings: tx.type === 'income' 
        ? data.netSavings - tx.amount 
        : data.netSavings + tx.amount,
      transactions: data.transactions.filter(t => t.id !== id),
      categoryBreakdown: data.categoryBreakdown.map(cat => {
        if (cat.name === tx.category) {
          const newSpent = tx.type === 'expense' ? cat.spent - tx.amount : cat.spent
          const newEarned = tx.type === 'income' ? cat.earned - tx.amount : cat.earned
          return {
            ...cat,
            spent: newSpent,
            earned: newEarned,
            transactionCount: cat.transactionCount - 1,
          }
        }
        return cat
      }),
    }

    try {
      await mutate(
        key,
        async () => {
          const res = await fetch(`/api/budget/transactions/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete transaction')
          const summaryRes = await fetch(key)
          return summaryRes.json()
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } catch (err) {
      throw err
    }
  }

  return {
    summary: data,
    loading,
    error: error?.message || null,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: () => mutate(key),
  }
}

export { ALL_CATEGORIES, getCategoryByName, getCategoriesByType } from '@/lib/constants/budget-categories'
