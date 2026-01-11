'use client'

import useSWR, { mutate } from 'swr'
import type { ShareLink } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const SHARE_LINKS_KEY = '/api/share-links'

export function useShareLinks() {
  const { data: shareLinks = [], error, isLoading: loading } = useSWR<ShareLink[]>(
    SHARE_LINKS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const createShareLink = async (data: {
    name: string
    allowed_pages: string[]
    expires_at?: string | null
  }) => {
    const res = await fetch('/api/share-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create share link')
    }
    
    const newShareLink = await res.json()
    mutate(SHARE_LINKS_KEY, [newShareLink, ...shareLinks], false)
    return newShareLink
  }

  const updateShareLink = async (id: string, data: {
    name?: string
    allowed_pages?: string[]
    expires_at?: string | null
  }) => {
    const res = await fetch(`/api/share-links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update share link')
    }
    
    const updated = await res.json()
    mutate(SHARE_LINKS_KEY, shareLinks.map(l => l.id === id ? updated : l), false)
    return updated
  }

  const deleteShareLink = async (id: string) => {
    const res = await fetch(`/api/share-links/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete share link')
    mutate(SHARE_LINKS_KEY, shareLinks.filter(l => l.id !== id), false)
  }

  const getShareUrl = (token: string) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/share/${token}`
  }

  return {
    shareLinks,
    loading,
    error: error?.message || null,
    createShareLink,
    updateShareLink,
    deleteShareLink,
    getShareUrl,
    refetch: () => mutate(SHARE_LINKS_KEY),
  }
}
