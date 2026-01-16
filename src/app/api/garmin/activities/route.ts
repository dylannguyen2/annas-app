import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'
import { createGarminClientFromTokens, fetchActivities, parseActivityData, getGarminTokens } from '@/lib/garmin/client'
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
  const { start = 0, limit = 20 } = body

  const { data: credentials } = await supabase
    .from('garmin_credentials')
    .select('oauth1_token, oauth2_token')
    .eq('user_id', effectiveUser.userId)
    .single()

  if (!credentials) {
    return NextResponse.json({ error: 'Garmin not connected' }, { status: 400 })
  }

  if (!credentials.oauth1_token || !credentials.oauth2_token) {
    return NextResponse.json({ error: 'Garmin tokens missing - please reconnect in Settings' }, { status: 400 })
  }

  try {
    const oauth1Token = decryptTokens(credentials.oauth1_token as string)
    const oauth2Token = decryptTokens(credentials.oauth2_token as string)

    console.log('OAuth1 token exists:', !!oauth1Token)
    console.log('OAuth2 token exists:', !!oauth2Token)

    const client = await createGarminClientFromTokens(oauth1Token, oauth2Token)
    const rawActivities = await fetchActivities(client, start, limit)

    const newTokens = getGarminTokens(client)
    if (newTokens.oauth1Token && newTokens.oauth2Token) {
      await supabase
        .from('garmin_credentials')
        .update({
          oauth1_token: encryptTokens(newTokens.oauth1Token),
          oauth2_token: encryptTokens(newTokens.oauth2Token),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', effectiveUser.userId)
    }

    const activities = rawActivities.map(parseActivityData)

    for (const activity of activities) {
      const { data: existing } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', effectiveUser.userId)
        .eq('garmin_activity_id', activity.garmin_activity_id)
        .single()

      if (existing) {
        await supabase
          .from('activities')
          .update({ ...activity, synced_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('activities')
          .insert({ ...activity, user_id: effectiveUser.userId, synced_at: new Date().toISOString() })
      }
    }

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities,
    })
  } catch (error) {
    console.error('Garmin activities sync error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch activities' 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const activityType = searchParams.get('type')

  let query = supabase
    .from('activities')
    .select('*', { count: 'exact' })
    .eq('user_id', effectiveUser.userId)
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1)

  if (activityType) {
    query = query.eq('activity_type', activityType)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data,
    total: count,
    hasMore: (offset + limit) < (count || 0),
    offset,
    limit,
  })
}
