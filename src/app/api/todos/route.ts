import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(todos)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    .eq('user_id', user.id)
    .eq('quadrant', quadrant)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPosition?.position ?? -1) + 1

  const { data: todo, error } = await supabase
    .from('todos')
    .insert({
      user_id: user.id,
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
