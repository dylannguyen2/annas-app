import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function GET() {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .select('*, budget_categories(name, icon, color)')
    .eq('user_id', effectiveUser.userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(recurring)
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
      user_id: effectiveUser.userId,
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
