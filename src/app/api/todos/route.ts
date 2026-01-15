import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

export async function GET() {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(todos)
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
  const { title, description, quadrant, due_date } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!quadrant || !['do_first', 'schedule', 'delegate', 'eliminate'].includes(quadrant)) {
    return NextResponse.json({ error: 'Valid quadrant is required' }, { status: 400 })
  }

  const { data: maxPosition } = await supabase
    .from('todos')
    .select('position')
    .eq('user_id', effectiveUser.userId)
    .eq('quadrant', quadrant)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPosition?.position ?? -1) + 1

  const { data: todo, error } = await supabase
    .from('todos')
    .insert({
      user_id: effectiveUser.userId,
      title,
      description: description || null,
      quadrant,
      due_date: due_date || null,
      position: newPosition,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(todo)
}
