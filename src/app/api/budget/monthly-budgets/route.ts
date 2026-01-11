import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  let query = supabase
    .from('monthly_budgets')
    .select('*, budget_categories(name, icon, color, type)')
    .eq('user_id', user.id)

  if (month) query = query.eq('month', month)

  const { data: budgets, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(budgets)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { category_id, month, amount } = body

  if (!category_id || !month || amount === undefined) {
    return NextResponse.json({ error: 'Category, month, and amount are required' }, { status: 400 })
  }

  const { data: budget, error } = await supabase
    .from('monthly_budgets')
    .upsert({
      user_id: user.id,
      category_id,
      month,
      amount,
    }, { onConflict: 'user_id,category_id,month' })
    .select('*, budget_categories(name, icon, color, type)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(budget)
}
