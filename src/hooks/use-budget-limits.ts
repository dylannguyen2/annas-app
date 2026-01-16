'use client'

import useSWR, { mutate } from 'swr'
import { format, startOfMonth } from 'date-fns'

export type BudgetPeriod = 'weekly' | 'monthly'

export interface BudgetLimit {
  id: string
  user_id: string
  category_id: string
  month: string
  amount: number
  period: BudgetPeriod
  created_at: string
  updated_at: string
  budget_categories?: {
    name: string
    icon: string
    color: string
    type: 'expense' | 'income'
  }
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const getBudgetsKey = (month: string) => `/api/budget/monthly-budgets?month=${month}`

export function useBudgetLimits(month: Date = new Date()) {
  const monthStr = format(startOfMonth(month), 'yyyy-MM-dd')
  const key = getBudgetsKey(monthStr)
  
  const { data, error, isLoading: loading } = useSWR<BudgetLimit[]>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  const setBudgetLimit = async (
    categoryId: string,
    amount: number,
    period: BudgetPeriod = 'monthly'
  ) => {
    const optimisticData = data ? [...data] : []
    const existingIndex = optimisticData.findIndex(b => b.category_id === categoryId)
    
    const optimisticBudget: BudgetLimit = {
      id: existingIndex >= 0 ? optimisticData[existingIndex].id : `temp-${Date.now()}`,
      user_id: '',
      category_id: categoryId,
      month: monthStr,
      amount,
      period,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      optimisticData[existingIndex] = { ...optimisticData[existingIndex], amount, period }
    } else {
      optimisticData.push(optimisticBudget)
    }

    try {
      await mutate(
        key,
        async () => {
          const res = await fetch('/api/budget/monthly-budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category_id: categoryId,
              month: monthStr,
              amount,
              period,
            }),
          })
          if (!res.ok) throw new Error('Failed to set budget limit')
          const budgetsRes = await fetch(key)
          return budgetsRes.json()
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

  const deleteBudgetLimit = async (id: string) => {
    const optimisticData = data?.filter(b => b.id !== id) || []

    try {
      await mutate(
        key,
        async () => {
          const res = await fetch(`/api/budget/monthly-budgets/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete budget limit')
          return optimisticData
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

  const getBudgetForCategory = (categoryId: string): BudgetLimit | undefined => {
    return data?.find(b => b.category_id === categoryId)
  }

  return {
    budgets: data || [],
    loading,
    error: error?.message || null,
    setBudgetLimit,
    deleteBudgetLimit,
    getBudgetForCategory,
    refetch: () => mutate(key),
  }
}
