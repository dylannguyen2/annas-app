import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function GET() {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: settings } = await supabase
    .from('cycle_settings')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .single()

  return NextResponse.json(settings || { average_cycle_length: 28, average_period_length: 5 })
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
  const { average_cycle_length, average_period_length } = body

  const { data: existing } = await supabase
    .from('cycle_settings')
    .select('id')
    .eq('user_id', effectiveUser.userId)
    .single()

  if (existing) {
    const { data: updated, error } = await supabase
      .from('cycle_settings')
      .update({
        average_cycle_length,
        average_period_length,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(updated)
  }

  const { data: newSettings, error } = await supabase
    .from('cycle_settings')
    .insert({
      user_id: effectiveUser.userId,
      average_cycle_length: average_cycle_length || 28,
      average_period_length: average_period_length || 5,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newSettings)
}
