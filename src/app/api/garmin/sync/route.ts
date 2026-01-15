import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'
import { createGarminClientFromTokens, fetchGarminData, parseSleepData, parseHeartRateData, getGarminTokens, fetchActivities, parseActivityData } from '@/lib/garmin/client'
import { decryptTokens, encryptTokens } from '@/lib/garmin/encryption'

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
  const { date } = body
  const syncDate = date ? new Date(date) : new Date()

  const { data: credentials } = await supabase
    .from('garmin_credentials')
    .select('oauth1_token, oauth2_token')
    .eq('user_id', effectiveUser.userId)
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
        .eq('user_id', effectiveUser.userId)
    }

    const sleepParsed = parseSleepData(rawData.sleep)
    const heartParsed = parseHeartRateData(rawData.heartRate)

    const dateStr = syncDate.toISOString().split('T')[0]

    const healthData = {
      user_id: effectiveUser.userId,
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
      .eq('user_id', effectiveUser.userId)
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

    const rawActivities = await fetchActivities(client, 0, 20)
    const activities = rawActivities.map(parseActivityData)
    let activitiesSynced = 0

    for (const activity of activities) {
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', effectiveUser.userId)
        .eq('garmin_activity_id', activity.garmin_activity_id)
        .single()

      if (existingActivity) {
        await supabase
          .from('activities')
          .update({ ...activity, synced_at: new Date().toISOString() })
          .eq('id', existingActivity.id)
      } else {
        await supabase
          .from('activities')
          .insert({ ...activity, user_id: effectiveUser.userId, synced_at: new Date().toISOString() })
      }
      activitiesSynced++
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      data: {
        steps: rawData.steps,
        sleep: sleepParsed,
        heartRate: heartParsed,
        activitiesSynced,
      },
    })
  } catch (error) {
    console.error('Garmin sync error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync with Garmin' 
    }, { status: 500 })
  }
}
