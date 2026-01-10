import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { date, meal_type, photo_url, photo_urls, description, location, notes, pinned } = body

  const updateData: Record<string, unknown> = {}
  if (date !== undefined) updateData.date = date
  if (meal_type !== undefined) updateData.meal_type = meal_type
  if (description !== undefined) updateData.description = description
  if (location !== undefined) updateData.location = location
  if (notes !== undefined) updateData.notes = notes
  if (pinned !== undefined) updateData.pinned = pinned
  if (photo_urls !== undefined) {
    updateData.photo_urls = photo_urls
    updateData.photo_url = photo_urls[0] || null
  } else if (photo_url !== undefined) {
    updateData.photo_url = photo_url
  }

  const { data: updated, error } = await supabase
    .from('meals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
