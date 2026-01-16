import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  let query = supabase
    .from('monthly_budgets')
    .select('*, budget_categories(name, icon, color, type)')
    .eq('user_id', effectiveUser.userId)

  if (month) query = query.eq('month', month)

  const { data: budgets, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(budgets)
}

export async function POST(request: Request) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const body = await request.json()
  const { category_id, month, amount, period = 'monthly' } = body

  if (!category_id || !month || amount === undefined) {
    return NextResponse.json({ error: 'Category, month, and amount are required' }, { status: 400 })
  }

  if (period && !['weekly', 'monthly'].includes(period)) {
    return NextResponse.json({ error: 'Period must be weekly or monthly' }, { status: 400 })
  }

  const { data: budget, error } = await supabase
    .from('monthly_budgets')
    .upsert({
      user_id: effectiveUser.userId,
      category_id,
      month,
      amount,
      period,
    }, { onConflict: 'user_id,category_id,month' })
    .select('*, budget_categories(name, icon, color, type)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(budget)
}
