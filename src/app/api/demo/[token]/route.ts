import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  
  try {
    const supabase = getSupabaseAdmin()

    const { data: session, error } = await supabase
      .from('demo_sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !session) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid or expired demo link',
        debug: { tokenReceived: token, dbError: error?.message }
      }, { status: 404 })
    }

    if (session.ended_at) {
      return NextResponse.json({ valid: false, error: 'Demo session has ended' }, { status: 404 })
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Demo session has expired' }, { status: 404 })
    }

    return NextResponse.json({ 
      valid: true,
      owner_id: session.owner_id,
      expires_at: session.expires_at,
    })
  } catch (err) {
    return NextResponse.json({ 
      valid: false, 
      error: 'Server error',
      debug: { message: err instanceof Error ? err.message : 'Unknown error' }
    }, { status: 500 })
  }
}
