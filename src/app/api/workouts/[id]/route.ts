import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const effectiveUser = await getEffectiveUser()
  const { id } = await params

  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const body = await request.json()

  const { data: workout, error } = await supabase
    .from('workout_notes')
    .update({
      ...(body.workout_type && { workout_type: body.workout_type }),
      ...(body.duration_minutes !== undefined && { duration_minutes: body.duration_minutes }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.intensity && { intensity: body.intensity }),
      ...(body.date && { date: body.date }),
    })
    .eq('id', id)
    .eq('user_id', effectiveUser.userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(workout)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const effectiveUser = await getEffectiveUser()
  const { id } = await params

  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('workout_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', effectiveUser.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
