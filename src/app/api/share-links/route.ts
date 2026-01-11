import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: shareLinks, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(shareLinks)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, allowed_pages, expires_at } = body

  if (!name || !allowed_pages || !Array.isArray(allowed_pages) || allowed_pages.length === 0) {
    return NextResponse.json(
      { error: 'name and allowed_pages (non-empty array) are required' },
      { status: 400 }
    )
  }

  const token = generateToken()

  const { data: shareLink, error } = await supabase
    .from('share_links')
    .insert({
      owner_id: user.id,
      token,
      name,
      allowed_pages,
      expires_at: expires_at || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(shareLink)
}
