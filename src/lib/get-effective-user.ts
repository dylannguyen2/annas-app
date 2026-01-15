import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface EffectiveUser {
  userId: string
  isShareView: boolean
  isReadOnly: boolean
}

export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  const cookieStore = await cookies()
  const shareToken = cookieStore.get('share_token')?.value
  const shareOwnerId = cookieStore.get('share_owner_id')?.value

  // Check if this is a share view
  if (shareToken && shareOwnerId) {
    const supabase = getSupabaseAdmin()
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('owner_id, expires_at')
      .eq('token', shareToken)
      .eq('owner_id', shareOwnerId)
      .single()

    if (shareLink) {
      const isExpired = shareLink.expires_at && new Date(shareLink.expires_at) < new Date()
      if (!isExpired) {
        return {
          userId: shareLink.owner_id,
          isShareView: true,
          isReadOnly: true, // Share viewers can only read, not modify
        }
      }
    }
  }

  // Not a share view - check for authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return {
    userId: user.id,
    isShareView: false,
    isReadOnly: false,
  }
}
