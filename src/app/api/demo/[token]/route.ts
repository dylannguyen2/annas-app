import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('demo_sessions')
    .select('*')
    .eq('token', token)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!session) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired demo link' }, { status: 404 })
  }

  return NextResponse.json({ 
    valid: true,
    owner_id: session.owner_id,
    expires_at: session.expires_at,
  })
}
