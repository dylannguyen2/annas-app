import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  let query = supabase
    .from('meals')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data: meals, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(meals)
}

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
  const { date, meal_type, photo_url, photo_urls, description, location, notes } = body

  if (!date || !meal_type) {
    return NextResponse.json({ error: 'Date and meal type are required' }, { status: 400 })
  }

  const finalPhotoUrls = photo_urls || (photo_url ? [photo_url] : [])

  const { data: newMeal, error } = await supabase
    .from('meals')
    .insert({
      user_id: effectiveUser.userId,
      date,
      meal_type,
      photo_url: finalPhotoUrls[0] || null,
      photo_urls: finalPhotoUrls,
      description,
      location,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newMeal)
}
