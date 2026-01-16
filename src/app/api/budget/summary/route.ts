import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'
import { ALL_CATEGORIES, getCategoryByName } from '@/lib/constants/budget-categories'

export async function GET(request: Request) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  if (!month) {
    return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 })
  }

  const startDate = `${month}-01`
  const endDate = new Date(month + '-01')
  endDate.setMonth(endDate.getMonth() + 1)
  endDate.setDate(0)
  const endDateStr = endDate.toISOString().split('T')[0]

  const { data: transactions, error } = await supabase
    .from('budget_transactions')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .gte('date', startDate)
    .lte('date', endDateStr)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const txList = transactions || []

  const { data: budgets } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .eq('month', startDate)

  const budgetMap = new Map<string, { amount: number; period: string }>()
  const weeksInMonth = Math.ceil((endDate.getDate()) / 7)
  
  for (const b of budgets || []) {
    const monthlyAmount = b.period === 'weekly' 
      ? Number(b.amount) * weeksInMonth 
      : Number(b.amount)
    budgetMap.set(b.category_id, { amount: monthlyAmount, period: b.period || 'monthly' })
  }

  const totalIncome = txList
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = txList
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const categoryBreakdown = ALL_CATEGORIES.map(cat => {
    const categoryTxs = txList.filter(t => t.category === cat.name)
    const budget = budgetMap.get(cat.id)

    const spent = categoryTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const earned = categoryTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const budgetAmount = budget?.amount || 0
    const remaining = budgetAmount - spent
    const percentUsed = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0

    return {
      ...cat,
      spent,
      earned,
      budgetAmount,
      remaining,
      percentUsed,
      transactionCount: categoryTxs.length,
    }
  })

  const totalBudgeted = Array.from(budgetMap.values()).reduce((sum, b) => sum + b.amount, 0)
  const budgetRemaining = totalBudgeted - totalExpenses

  const transactionsWithCategory = txList.map(t => ({
    ...t,
    categoryInfo: t.category ? getCategoryByName(t.category) : null,
  }))

  return NextResponse.json({
    month: startDate,
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    totalBudgeted,
    budgetRemaining,
    categoryBreakdown: categoryBreakdown.filter(c => c.spent > 0 || c.earned > 0 || c.budgetAmount > 0),
    transactions: transactionsWithCategory,
  })
}
