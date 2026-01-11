import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: shareLink, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !shareLink) {
    redirect(`/share/${token}?error=invalid`)
  }

  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    redirect(`/share/${token}?error=expired`)
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

  const destination = shareLink.allowed_pages[0] || '/'
  redirect(destination)
}
