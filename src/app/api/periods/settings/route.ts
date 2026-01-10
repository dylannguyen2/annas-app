import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await supabase
    .from('cycle_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(settings || { average_cycle_length: 28, average_period_length: 5 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { average_cycle_length, average_period_length } = body

  const { data: existing } = await supabase
    .from('cycle_settings')
    .select('id')
    .eq('user_id', user.id)
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
      user_id: user.id,
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
