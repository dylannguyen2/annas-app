import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const { data: shareLink, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !shareLink) {
    return NextResponse.json({ error: 'Invalid share link' }, { status: 404 })
  }

  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
  }

  await supabase
    .from('share_links')
    .update({
      last_accessed_at: new Date().toISOString(),
      access_count: shareLink.access_count + 1,
    })
    .eq('id', shareLink.id)

  const cookieStore = await cookies()
  cookieStore.set('share_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  cookieStore.set('share_owner_id', shareLink.owner_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return NextResponse.json({
    valid: true,
    name: shareLink.name,
    allowed_pages: shareLink.allowed_pages,
    owner_id: shareLink.owner_id,
  })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('share_token')
  cookieStore.delete('share_owner_id')
  
  return NextResponse.json({ success: true })
}
