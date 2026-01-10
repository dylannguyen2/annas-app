'use client'

import { useState, useEffect, useCallback } from 'react'

export type MediaStatus = 'want_to_watch' | 'watching' | 'finished'
export type MediaType = 'movie' | 'tv'

export interface Media {
  id: string
  user_id: string
  tmdb_id: number
  media_type: MediaType
  title: string
  poster_url: string | null
  backdrop_url: string | null
  overview: string | null
  release_date: string | null
  runtime: number | null
  vote_average: number | null
  genres: string[] | null
  status: MediaStatus
  rating: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface SearchResult {
  tmdb_id: number
  media_type: MediaType
  title: string
  poster_url: string | null
  backdrop_url: string | null
  overview: string | null
  release_date: string | null
  vote_average: number | null
  genres: string[]
}

export function useMedia() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedia = useCallback(async (status?: MediaStatus, mediaType?: MediaType) => {
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (mediaType) params.set('media_type', mediaType)
      
      const res = await fetch(`/api/media?${params}`)
      if (!res.ok) throw new Error('Failed to fetch media')
      const data = await res.json()
      setMedia(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const searchMedia = async (query: string, type?: MediaType): Promise<SearchResult[]> => {
    if (!query.trim()) return []
    
    const params = new URLSearchParams({ q: query })
    if (type) params.set('type', type)
    
    const res = await fetch(`/api/media/search?${params}`)
    if (!res.ok) throw new Error('Failed to search media')
    return res.json()
  }

  const addMedia = async (data: {
    tmdb_id: number
    media_type: MediaType
    title: string
    poster_url?: string | null
    backdrop_url?: string | null
    overview?: string | null
    release_date?: string | null
    runtime?: number | null
    vote_average?: number | null
    genres?: string[] | null
    status?: MediaStatus
    rating?: number | null
    started_at?: string | null
    finished_at?: string | null
  }) => {
    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to add media')
    }
    
    const newMedia = await res.json()
    setMedia(prev => [newMedia, ...prev])
    return newMedia
  }

  const updateMedia = async (id: string, data: Partial<Omit<Media, 'id' | 'user_id' | 'created_at'>>) => {
    const res = await fetch(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update media')
    }
    
    const updated = await res.json()
    setMedia(prev => prev.map(m => m.id === id ? updated : m))
    return updated
  }

  const deleteMedia = async (id: string) => {
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete media')
    setMedia(prev => prev.filter(m => m.id !== id))
  }

  const getMediaByStatus = (status: MediaStatus): Media[] => {
    return media.filter(m => m.status === status)
  }

  const getMediaByType = (type: MediaType): Media[] => {
    return media.filter(m => m.media_type === type)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchMedia()
      setLoading(false)
    }
    init()
  }, [fetchMedia])

  return {
    media,
    loading,
    error,
    searchMedia,
    addMedia,
    updateMedia,
    deleteMedia,
    getMediaByStatus,
    getMediaByType,
    refetch: fetchMedia,
  }
}
