'use client'

import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'

interface Profile {
  id: string
  display_name: string | null
  created_at: string
  updated_at: string
}

const fetcher = async (): Promise<Profile | null> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data
}

export function useProfile() {
  const { data: profile, error, isLoading, mutate } = useSWR<Profile | null>(
    'profile',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name'>>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Not authenticated')
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    if (error) throw error
    
    mutate()
  }

  return {
    profile,
    loading: isLoading,
    error,
    updateProfile,
    displayName: profile?.display_name || null,
  }
}
