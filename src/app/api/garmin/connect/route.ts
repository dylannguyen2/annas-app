import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createGarminClient, getGarminTokens } from '@/lib/garmin/client'
import { encryptTokens } from '@/lib/garmin/encryption'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    const client = await createGarminClient(email, password)
    const tokens = getGarminTokens(client)
    
    if (!tokens.oauth1Token || !tokens.oauth2Token) {
      throw new Error('Failed to retrieve Garmin tokens')
    }
    
    const encryptedOauth1 = encryptTokens(tokens.oauth1Token)
    const encryptedOauth2 = encryptTokens(tokens.oauth2Token)

    const { error: upsertError } = await supabase
      .from('garmin_credentials')
      .upsert({
        user_id: user.id,
        oauth1_token: encryptedOauth1,
        oauth2_token: encryptedOauth2,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Garmin login error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to connect to Garmin' 
    }, { status: 400 })
  }
}
