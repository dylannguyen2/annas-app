import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from '@/lib/demo'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasDemoPassword: !!process.env.DEMO_ACCOUNT_PASSWORD,
  })
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY' 
      }, { status: 500 })
    }

    if (!process.env.DEMO_ACCOUNT_PASSWORD) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server misconfigured: missing DEMO_ACCOUNT_PASSWORD' 
      }, { status: 500 })
    }

    const supabase = getSupabaseAdmin()

    const { data: session, error: sessionError } = await supabase
      .from('demo_sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: 'Invalid demo token' }, { status: 404 })
    }

    if (session.ended_at) {
      return NextResponse.json({ success: false, error: 'Demo session has ended' }, { status: 400 })
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Demo session has expired' }, { status: 400 })
    }

    const { data: users } = await supabase.auth.admin.listUsers()
    let demoUser = users.users.find(u => u.email === DEMO_ACCOUNT_EMAIL)

    if (!demoUser) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: DEMO_ACCOUNT_EMAIL,
        password: DEMO_ACCOUNT_PASSWORD,
        email_confirm: true,
        user_metadata: { is_demo_account: true }
      })

      if (createError || !newUser.user) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create demo account',
          debug: createError?.message 
        }, { status: 500 })
      }

      demoUser = newUser.user
    }

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_ACCOUNT_EMAIL,
      password: DEMO_ACCOUNT_PASSWORD,
    })

    if (signInError || !sessionData.session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to sign in to demo account',
        debug: signInError?.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: session.expires_at,
    })

  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      debug: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
