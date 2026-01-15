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

  const totalIncome = txList
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = txList
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const categoryBreakdown = ALL_CATEGORIES.map(cat => {
    const categoryTxs = txList.filter(t => t.category === cat.name)

    const spent = categoryTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const earned = categoryTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      ...cat,
      spent,
      earned,
      budgetAmount: 0,
      remaining: 0,
      percentUsed: 0,
      transactionCount: categoryTxs.length,
    }
  })

  const transactionsWithCategory = txList.map(t => ({
    ...t,
    categoryInfo: t.category ? getCategoryByName(t.category) : null,
  }))

  return NextResponse.json({
    month: startDate,
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    totalBudgeted: 0,
    budgetRemaining: 0,
    categoryBreakdown: categoryBreakdown.filter(c => c.spent > 0 || c.earned > 0),
    transactions: transactionsWithCategory,
  })
}
