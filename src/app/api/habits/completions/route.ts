import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const habitId = searchParams.get('habit_id')

  let query = supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', user.id)

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  if (habitId) {
    query = query.eq('habit_id', habitId)
  }

  const { data: completions, error } = await query.order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(completions)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { habit_id, date, completed, notes } = body

  if (!habit_id || !date) {
    return NextResponse.json({ error: 'habit_id and date are required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habit_id)
    .eq('date', date)
    .single()

  if (existing) {
    if (completed === false) {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ deleted: true })
    }

    const { data: updated, error } = await supabase
      .from('habit_completions')
      .update({ completed: completed ?? true, notes })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(updated)
  }

  const { data: completion, error } = await supabase
    .from('habit_completions')
    .insert({
      habit_id,
      user_id: user.id,
      date,
      completed: completed ?? true,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(completion)
}
