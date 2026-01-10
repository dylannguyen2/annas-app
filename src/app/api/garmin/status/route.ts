import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: credentials } = await supabase
    .from('garmin_credentials')
    .select('id, last_sync_at, created_at, updated_at')
    .eq('user_id', user.id)
    .single()

  if (!credentials) {
    return NextResponse.json({ 
      connected: false,
      lastSync: null,
    })
  }

  return NextResponse.json({
    connected: true,
    lastSync: credentials.last_sync_at,
    connectedAt: credentials.created_at,
  })
}

export async function DELETE() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('garmin_credentials')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
