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
  const limit = parseInt(searchParams.get('limit') || '50')

  const { data: workouts, error } = await supabase
    .from('workout_notes')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(workouts)
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
  const { date, workout_type, duration_minutes, calories, notes, intensity } = body

  if (!date || !workout_type) {
    return NextResponse.json({ error: 'Date and workout type are required' }, { status: 400 })
  }

  const { data: workout, error } = await supabase
    .from('workout_notes')
    .insert({
      user_id: effectiveUser.userId,
      date,
      workout_type,
      duration_minutes,
      calories,
      notes,
      intensity,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(workout)
}
