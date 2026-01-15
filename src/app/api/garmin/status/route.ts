import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function GET() {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: credentials } = await supabase
    .from('garmin_credentials')
    .select('id, last_sync_at, created_at, updated_at')
    .eq('user_id', effectiveUser.userId)
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
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('garmin_credentials')
    .delete()
    .eq('user_id', effectiveUser.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
