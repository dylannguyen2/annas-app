import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const { id } = await params

  const body = await request.json()

  const { data: transaction, error } = await supabase
    .from('budget_transactions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', effectiveUser.userId)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(transaction)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const { id } = await params

  const { error } = await supabase
    .from('budget_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', effectiveUser.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
