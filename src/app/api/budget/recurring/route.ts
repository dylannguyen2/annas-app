import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .select('*, budget_categories(name, icon, color)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(recurring)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { 
    category_id, 
    type, 
    amount, 
    description, 
    frequency, 
    start_date,
    end_date,
    day_of_month,
    day_of_week,
    notes 
  } = body

  if (!type || !amount || !description || !frequency || !start_date) {
    return NextResponse.json({ 
      error: 'Type, amount, description, frequency, and start date are required' 
    }, { status: 400 })
  }

  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: user.id,
      category_id,
      type,
      amount,
      description,
      frequency,
      start_date,
      end_date,
      day_of_month,
      day_of_week,
      notes,
    })
    .select('*, budget_categories(name, icon, color)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(recurring)
}
