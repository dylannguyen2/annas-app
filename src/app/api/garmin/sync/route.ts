import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createGarminClientFromTokens, fetchGarminData, parseSleepData, parseHeartRateData, getGarminTokens } from '@/lib/garmin/client'
import { decryptTokens, encryptTokens } from '@/lib/garmin/encryption'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date } = body
  const syncDate = date ? new Date(date) : new Date()

  const { data: credentials } = await supabase
    .from('garmin_credentials')
    .select('oauth1_token, oauth2_token')
    .eq('user_id', user.id)
    .single()

  if (!credentials) {
    return NextResponse.json({ error: 'Garmin not connected' }, { status: 400 })
  }

  try {
    const oauth1Token = decryptTokens(credentials.oauth1_token as string)
    const oauth2Token = decryptTokens(credentials.oauth2_token as string)

    const client = await createGarminClientFromTokens(oauth1Token, oauth2Token)
    const rawData = await fetchGarminData(client, syncDate)

    const newTokens = getGarminTokens(client)
    if (newTokens.oauth1Token && newTokens.oauth2Token) {
      await supabase
        .from('garmin_credentials')
        .update({
          oauth1_token: encryptTokens(newTokens.oauth1Token),
          oauth2_token: encryptTokens(newTokens.oauth2Token),
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }

    const sleepParsed = parseSleepData(rawData.sleep)
    const heartParsed = parseHeartRateData(rawData.heartRate)

    const dateStr = syncDate.toISOString().split('T')[0]

    const healthData = {
      user_id: user.id,
      date: dateStr,
      steps: rawData.steps || null,
      ...sleepParsed,
      ...heartParsed,
      raw_sleep_data: rawData.sleep,
      raw_heart_data: rawData.heartRate,
      synced_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('health_data')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .single()

    if (existing) {
      await supabase
        .from('health_data')
        .update(healthData)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('health_data')
        .insert(healthData)
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      data: {
        steps: rawData.steps,
        sleep: sleepParsed,
        heartRate: heartParsed,
      },
    })
  } catch (error) {
    console.error('Garmin sync error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync with Garmin' 
    }, { status: 500 })
  }
}
