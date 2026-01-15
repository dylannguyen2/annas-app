import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { clearDemoAccountData } from '@/lib/demo'

const DEMO_OWNER_UID = 'd87e8362-b65e-433c-903c-bc1b12765f49'

export async function POST() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== DEMO_OWNER_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: existingSession } = await supabase
    .from('demo_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingSession) {
    return NextResponse.json({ 
      token: existingSession.token,
      expires_at: existingSession.expires_at,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/demo/${existingSession.token}`
    })
  }

  await clearDemoAccountData()

  const token = randomBytes(16).toString('hex')
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: session, error } = await supabase
    .from('demo_sessions')
    .insert({
      owner_id: user.id,
      token,
      expires_at,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    token: session.token,
    expires_at: session.expires_at,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/demo/${session.token}`
  })
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== DEMO_OWNER_UID) {
    return NextResponse.json({ active: false, unauthorized: true })
  }

  const adminSupabase = getSupabaseAdmin()
  const { data: session } = await adminSupabase
    .from('demo_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .is('ended_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ active: false })
  }

  const isExpired = new Date(session.expires_at) < new Date()

  return NextResponse.json({ 
    active: true,
    expired: isExpired,
    token: session.token,
    expires_at: session.expires_at,
    started_at: session.started_at,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/demo/${session.token}`
  })
}

export async function DELETE() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== DEMO_OWNER_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = getSupabaseAdmin()
  
  const { data: session, error: queryError } = await adminSupabase
    .from('demo_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .is('ended_at', null)
    .maybeSingle()

  if (queryError || !session) {
    console.error('Demo session query error:', queryError)
    return NextResponse.json({ error: 'No active demo session' }, { status: 404 })
  }

  await clearDemoAccountData()

  const { error: updateError } = await adminSupabase
    .from('demo_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', session.id)

  if (updateError) {
    console.error('Demo session update error:', updateError)
    return NextResponse.json({ error: 'Failed to end demo session' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
