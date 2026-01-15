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
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const category = searchParams.get('category')
  const type = searchParams.get('type')

  let query = supabase
    .from('budget_transactions')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  if (category) query = query.eq('category', category)
  if (type) query = query.eq('type', type)

  const { data: transactions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(transactions)
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
  const { category, type, amount, description, date, notes, recurring_id } = body

  if (!type || !amount || !date) {
    return NextResponse.json({ error: 'Type, amount, and date are required' }, { status: 400 })
  }

  const { data: transaction, error } = await supabase
    .from('budget_transactions')
    .insert({
      user_id: effectiveUser.userId,
      category,
      type,
      amount,
      description,
      date,
      notes,
      recurring_id,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(transaction)
}
