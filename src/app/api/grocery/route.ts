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
  const listId = searchParams.get('listId')

  let query = supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', effectiveUser.userId)

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data: items, error } = await query
    .order('checked', { ascending: true })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(items)
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
  const { name, quantity, unit, category, woolworths_id, woolworths_price, coles_id, coles_price, image_url, notes, list_id } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  let query = supabase
    .from('grocery_items')
    .select('position')
    .eq('user_id', effectiveUser.userId)

  if (list_id) {
    query = query.eq('list_id', list_id)
  }

  const { data: maxPosition } = await query
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (maxPosition?.position ?? -1) + 1

  const { data: item, error } = await supabase
    .from('grocery_items')
    .insert({
      user_id: effectiveUser.userId,
      list_id: list_id || null,
      name,
      quantity: quantity || 1,
      unit,
      category,
      woolworths_id,
      woolworths_price,
      coles_id,
      coles_price,
      image_url,
      notes,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(item)
}

export async function DELETE(request: Request) {
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const clearChecked = searchParams.get('clearChecked')
  const listId = searchParams.get('listId')

  if (clearChecked === 'true') {
    let query = supabase
      .from('grocery_items')
      .delete()
      .eq('user_id', effectiveUser.userId)
      .eq('checked', true)

    if (listId) {
      query = query.eq('list_id', listId)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
}
