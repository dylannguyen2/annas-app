import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const mediaType = searchParams.get('media_type')

  let query = supabase
    .from('media')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  
  if (mediaType) {
    query = query.eq('media_type', mediaType)
  }

  const { data: media, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(media)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { 
    tmdb_id, 
    media_type, 
    title, 
    poster_url, 
    backdrop_url, 
    overview, 
    release_date, 
    runtime,
    vote_average,
    genres,
    status, 
    rating, 
    started_at, 
    finished_at 
  } = body

  if (!tmdb_id || !media_type || !title) {
    return NextResponse.json({ error: 'tmdb_id, media_type, and title are required' }, { status: 400 })
  }

  const { data: newMedia, error } = await supabase
    .from('media')
    .insert({
      user_id: user.id,
      tmdb_id,
      media_type,
      title,
      poster_url,
      backdrop_url,
      overview,
      release_date,
      runtime,
      vote_average,
      genres,
      status: status || 'want_to_watch',
      rating,
      started_at,
      finished_at,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This title is already in your library' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newMedia)
}
